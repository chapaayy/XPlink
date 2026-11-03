import type { MatrixClient } from 'matrix-js-sdk';
import { EventType, MsgType } from 'matrix-js-sdk';
import { assertEncryptedRoom } from './crypto';
import { assertStableRoomIdentities } from './identity';

export async function sendEncryptedMessage(
  client: MatrixClient,
  roomId: string,
  text: string,
): Promise<void> {
  if (!text.trim()) return;
  await assertEncryptedRoom(client, roomId);
  await assertStableRoomIdentities(client, roomId);
  // SDK encrypts m.room.message before upload in encrypted rooms.
  await client.sendEvent(roomId, EventType.RoomMessage, {
    msgtype: MsgType.Text,
    body: text.trim(),
  });
}
