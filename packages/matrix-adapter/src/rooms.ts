import type { MatrixClient } from 'matrix-js-sdk';
import { Preset, Visibility } from 'matrix-js-sdk';

export interface RoomSummary {
  id: string;
  name: string;
  membership: string;
  encrypted: boolean;
}

export function listRooms(client: MatrixClient): RoomSummary[] {
  return client
    .getRooms()
    .filter((room) => ['join', 'invite'].includes(room.getMyMembership()))
    .map((room) => ({
      id: room.roomId,
      name: room.name,
      membership: room.getMyMembership(),
      encrypted: room.hasEncryptionStateEvent(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createEncryptedRoom(
  client: MatrixClient,
  name: string,
  invitee: string,
): Promise<string> {
  if (!client.getCrypto()) throw new Error('Невозможно создать комнату без Rust Crypto.');
  if (!name.trim()) throw new Error('Укажите название комнаты.');
  const { room_id } = await client.createRoom({
    name: name.trim(),
    visibility: Visibility.Private,
    preset: Preset.PrivateChat,
    invite: invitee.trim() ? [invitee.trim()] : [],
    initial_state: [
      {
        type: 'm.room.encryption',
        state_key: '',
        content: { algorithm: 'm.megolm.v1.aes-sha2' },
      },
    ],
  });
  return room_id;
}

export async function acceptRoomInvite(client: MatrixClient, roomId: string): Promise<void> {
  const room = client.getRoom(roomId);
  if (!room || room.getMyMembership() !== 'invite') throw new Error('Приглашение не найдено.');
  await client.joinRoom(roomId);
}
