import type { MatrixClient } from 'matrix-js-sdk';
import { EventType, MsgType } from 'matrix-js-sdk';
import { encryptAttachment, decryptAttachment } from 'matrix-encrypt-attachment';
import type { IEncryptedFile } from 'matrix-encrypt-attachment';
import { assertEncryptedRoom } from './crypto';
import { assertStableRoomIdentities } from './identity';

export interface AttachmentRef extends IEncryptedFile {
  url: string;
}

export interface ChatAttachment {
  name: string;
  mimeType: string;
  size: number;
  encrypted: AttachmentRef;
}

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/**
 * No plaintext upload and no URL fallback. The established Matrix.org
 * attachment library implements the v2 AES-CTR/SHA-256 media specification.
 */
export async function sendEncryptedAttachment(
  client: MatrixClient, roomId: string, file: File,
): Promise<void> {
  if (file.size <= 0 || file.size > MAX_ATTACHMENT_BYTES)
    throw new Error('Файл должен быть от 1 байта до 10 МБ.');
  await assertEncryptedRoom(client, roomId);
  await assertStableRoomIdentities(client, roomId);
  const name = file.name.replace(/[\\/\x00-\x1f]/g, '_').slice(0, 120) || 'file';
  const clearBytes = await file.arrayBuffer();
  let data: ArrayBuffer;
  let info: Awaited<ReturnType<typeof encryptAttachment>>['info'];
  try {
    ({ data, info } = await encryptAttachment(clearBytes));
  } finally {
    new Uint8Array(clearBytes).fill(0);
  }
  // The encrypted media's name and original MIME type are never sent to /upload.
  const uploaded = await client.uploadContent(new Blob([data], {
    type: 'application/octet-stream',
  }), { type: 'application/octet-stream', includeFilename: false });
  if (!uploaded.content_uri || !info.hashes?.sha256 || !info.key.k || !info.iv)
    throw new Error('Не удалось подготовить защищённое вложение.');
  await client.sendEvent(roomId, EventType.RoomMessage, {
    msgtype: MsgType.File,
    body: name,
    file: {
      url: uploaded.content_uri,
      v: 'v2',
      hashes: { sha256: info.hashes.sha256 },
      iv: info.iv,
      key: {
        alg: 'A256CTR',
        kty: 'oct',
        k: info.key.k,
        key_ops: ['encrypt', 'decrypt'],
        ext: true,
      },
    },
    info: { size: file.size, mimetype: file.type || 'application/octet-stream' },
  });
}

function authenticatedMediaUrl(client: MatrixClient, uri: string): string {
  // Construct only this fixed homeserver endpoint; never fetch arbitrary URLs.
  const match = /^mxc:\/\/([a-zA-Z0-9.:\-]+)\/([a-zA-Z0-9_\-]+)$/.exec(uri);
  if (!match) throw new Error('Вложение имеет неверный Matrix URI.');
  const [, server, mediaId] = match;
  return client.getHomeserverUrl().replace(/\/$/, '') +
    '/_matrix/client/v1/media/download/' +
    encodeURIComponent(server) + '/' + encodeURIComponent(mediaId);
}

export async function downloadEncryptedAttachment(
  client: MatrixClient, attachment: ChatAttachment,
): Promise<Blob> {
  const token = client.getAccessToken();
  if (!token) throw new Error('Сессия завершена.');
  const file = attachment.encrypted;
  if (file.v !== 'v2' || !file.hashes?.sha256 || !file.key?.k)
    throw new Error('Вложение не содержит действительного E2EE-описания.');
  const response = await fetch(authenticatedMediaUrl(client, file.url), {
    headers: { Authorization: 'Bearer ' + token },
  });
  if (!response.ok()) throw new Error('Недоступны зашифрованные данные файла.');
  const ciphertext = await response.arrayBuffer();
  if (ciphertext.byteLength > MAX_ATTACHMENT_BYTES + 4096)
    throw new Error('Слишком большой зашифрованный файл.');
  // The Matrix.org implementation verifies the SHA-256 before decrypting.
  const plaintext = await decryptAttachment(ciphertext, file);
  return new Blob([plaintext], { type: attachment.mimeType || 'application/octet-stream' });
}
