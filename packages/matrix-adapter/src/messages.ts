import type { MatrixClient } from 'matrix-js-sdk';
import { EventType } from 'matrix-js-sdk';
import { assertEncryptedRoom } from './crypto';

export async function sendEncryptedMessage(
  client: MatrixClient,
  roomId: string,
  text: string,
): Promise<void> {
  if (!text.trim()) return;
  await assertEncryptedRoom(client, roomId);
  // SDK encrypts m.room.message before upload in encrypted rooms.
  await client.sendEvent(roomId, EventType.RoomMessage, { msgtype: 'm.text', body: text.trim() });
}
