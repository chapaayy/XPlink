import type { MatrixClient } from 'matrix-js-sdk';
import { Preset, Visibility } from 'matrix-js-sdk';
import { assertEncryptedRoom } from './crypto';

type DirectMap = Record<string, string[]>;

export function directRoomMap(client: MatrixClient): DirectMap {
  const raw = client.getAccountData('m.direct')?.getContent();
  if (!raw || typeof raw !== 'object') return {};
  const map: DirectMap = {};
  for (const [userId, ids] of Object.entries(raw)) {
    if (Array.isArray(ids)) map[userId] = ids.filter((id): id is string => typeof id === 'string');
  }
  return map;
}

export function directRoomIds(client: MatrixClient): Set<string> {
  return new Set(Object.values(directRoomMap(client)).flat());
}

async function recordDirect(client: MatrixClient, userId: string, roomId: string): Promise<void> {
  const map = directRoomMap(client);
  map[userId] = [...new Set([...(map[userId] ?? []), roomId])];
  await client.setAccountData('m.direct', map);
}

export async function createDirectChat(client: MatrixClient, userId: string): Promise<string> {
  if (!client.getCrypto()) throw new Error('Rust Crypto не инициализирован.');
  const self = client.getUserId();
  const peer = userId.trim();
  if (!/^@[^:\s]+:.+/.test(peer) || peer === self)
    throw new Error('Введите Matrix ID другого пользователя.');
  const existing = directRoomMap(client)[peer]?.find(
    (id) => client.getRoom(id)?.getMyMembership() === 'join',
  );
  if (existing) {
    await assertEncryptedRoom(client, existing);
    return existing;
  }
  const { room_id } = await client.createRoom({
    visibility: Visibility.Private,
    preset: Preset.TrustedPrivateChat,
    is_direct: true,
    invite: [peer],
    initial_state: [
      {
        type: 'm.room.encryption',
        state_key: '',
        content: { algorithm: 'm.megolm.v1.aes-sha2' },
      },
    ],
  });
  await recordDirect(client, peer, room_id);
  return room_id;
}

export async function markIncomingDirect(client: MatrixClient, roomId: string): Promise<void> {
  const room = client.getRoom(roomId);
  const self = client.getUserId();
  if (!room || !self || room.getMyMembership() !== 'invite')
    throw new Error('Приглашение не найдено.');
  const invitation = room.currentState.getStateEvents('m.room.member', self);
  const direct = invitation?.getContent()?.is_direct === true;
  if (!direct) return;
  const sender = invitation?.getSender();
  if (!sender || sender === self) return;
  await recordDirect(client, sender, roomId);
}
