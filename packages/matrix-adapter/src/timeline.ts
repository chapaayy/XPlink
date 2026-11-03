import type { MatrixClient } from 'matrix-js-sdk';
import { EventType } from 'matrix-js-sdk';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  decrypting: boolean;
}

/** Never display a raw encrypted payload or claim it was successfully decrypted. */
export function roomMessages(client: MatrixClient, roomId: string): ChatMessage[] {
  const room = client.getRoom(roomId);
  if (!room) return [];
  return room
    .getLiveTimeline()
    .getEvents()
    .filter((event) => {
      return (
        event.getType() === EventType.RoomMessage || event.getWireType() === 'm.room.encrypted'
      );
    })
    .map((event) => {
      const decrypting = event.isEncrypted() && event.isDecryptionFailure();
      const content = event.getContent();
      const verifiedText =
        event.getType() === EventType.RoomMessage && content.msgtype === 'm.text';
      return {
        id: event.getId() ?? `pending-${event.getTs()}`,
        sender: event.getSender() ?? 'unknown',
        text:
          verifiedText && typeof content.body === 'string'
            ? content.body
            : '🔒 Сообщение пока не расшифровано',
        timestamp: event.getTs(),
        decrypting: !verifiedText || decrypting,
      };
    });
}
