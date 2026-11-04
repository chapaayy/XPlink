import type { MatrixClient } from 'matrix-js-sdk';
import { EventType, RelationType } from 'matrix-js-sdk';
import { assertEncryptedRoom } from './crypto';
import { assertStableRoomIdentities } from './identity';

export async function addReaction(
  client: MatrixClient,
  roomId: string,
  eventId: string,
  emoji: string,
): Promise<void> {
  if (!eventId.startsWith('$') || emoji.length === 0 || emoji.length > 12)
    throw new Error('Некорректное сообщение или реакция.');
  await assertEncryptedRoom(client, roomId);
  await assertStableRoomIdentities(client, roomId);
  // SDK must encrypt this m.reaction event as m.room.encrypted on the wire.
  await client.sendEvent(roomId, EventType.Reaction, {
    'm.relates_to': { rel_type: RelationType.Annotation, event_id: eventId, key: emoji },
  });
}
