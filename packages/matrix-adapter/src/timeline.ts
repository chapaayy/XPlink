import type { MatrixClient } from 'matrix-js-sdk';
import { EventType } from 'matrix-js-sdk';
import type { ChatAttachment } from './attachments';

export interface ReactionSummary {
  emoji: string;
  count: number;
  mine: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  decrypting: boolean;
  attachment?: ChatAttachment;
  reactions: ReactionSummary[];
}

/** Only *decrypted* content is exposed to React; no wire ciphertext in UI state. */
export function roomMessages(client: MatrixClient, roomId: string): ChatMessage[] {
  const room = client.getRoom(roomId);
  if (!room) return [];
  const events = room.getLiveTimeline().getEvents();
  const reactions = new Map<string, Map<string, { senders: Set<string> }>>();
  for (const event of events) {
    if (event.getType() !== 'm.reaction') continue;
    const rel = event.getContent()['m.relates_to'];
    const id = rel?.event_id;
    const key = rel?.key;
    const sender = event.getSender();
    if (
      rel?.rel_type !== 'm.annotation' ||
      typeof id !== 'string' ||
      typeof key !== 'string' ||
      !sender
    )
      continue;
    const byEmoji = reactions.get(id) ?? new Map();
    const users = byEmoji.get(key) ?? { senders: new Set<string>() };
    users.senders.add(sender);
    byEmoji.set(key, users);
    reactions.set(id, byEmoji);
  }
  return events
    .filter(
      (event) =>
        event.getType() === EventType.RoomMessage ||
        (event.getWireType() === 'm.room.encrypted' && event.getType() === 'm.room.encrypted'),
    )
    .map((event) => {
      const content = event.getContent();
      const textEvent = event.getType() === EventType.RoomMessage && content.msgtype === 'm.text';
      const fileEvent = event.getType() === EventType.RoomMessage && content.msgtype === 'm.file';
      const safeFile =
        fileEvent &&
        content.file &&
        content.file.v === 'v2' &&
        content.file.url &&
        content.file.hashes?.sha256 &&
        content.file.key?.k;
      const attachment: ChatAttachment | undefined = safeFile
        ? {
            name: typeof content.body === 'string' ? content.body : 'Файл',
            mimeType:
              typeof content.info?.mimetype === 'string'
                ? content.info.mimetype
                : 'application/octet-stream',
            size: typeof content.info?.size === 'number' ? content.info.size : 0,
            encrypted: content.file as ChatAttachment['encrypted'],
          }
        : undefined;
      const id = event.getId() ?? `pending-${event.getTs()}`;
      const myId = client.getUserId();
      return {
        id,
        sender: event.getSender() ?? 'unknown',
        text:
          textEvent && typeof content.body === 'string'
            ? content.body
            : attachment
              ? attachment.name
              : '🔒 Сообщение пока не расшифровано',
        timestamp: event.getTs(),
        decrypting: !textEvent && !attachment,
        attachment,
        reactions: [...(reactions.get(id)?.entries() ?? [])].map(([emoji, entry]) => ({
          emoji,
          count: entry.senders.size,
          mine: !!myId && entry.senders.has(myId),
        })),
      };
    });
}
