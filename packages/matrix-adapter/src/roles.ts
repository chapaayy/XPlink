import type { MatrixClient } from 'matrix-js-sdk';
import { EventType } from 'matrix-js-sdk';

export type ChannelRole = 'member' | 'moderator' | 'admin';
const LEVEL: Record<ChannelRole, number> = { member: 0, moderator: 50, admin: 100 };

interface Levels {
  users?: Record<string, number>;
  users_default?: number;
  events?: Record<string, number>;
  events_default?: number;
  state_default?: number;
  invite?: number;
  kick?: number;
  redact?: number;
}

/** Power levels are authoritative Matrix room state, not client-only role labels. */
export function roomPowerLevels(client: MatrixClient, roomId: string): Levels {
  const room = client.getRoom(roomId);
  if (!room) throw new Error('Комната отсутствует.');
  return (room.currentState.getStateEvents('m.room.power_levels', '')?.getContent() ??
    {}) as Levels;
}

export function isRoomCreator(client: MatrixClient, roomId: string, userId: string): boolean {
  const event = client.getRoom(roomId)?.currentState.getStateEvents('m.room.create', '');
  if (!event) return false;
  const content = event.getContent();
  const roomVersion = content.room_version;
  const version =
    typeof roomVersion === 'string' && /^\d+$/.test(roomVersion) ? Number(roomVersion) : 1;
  if (version < 12) return false;
  return (
    event.getSender() === userId ||
    (Array.isArray(content.additional_creators) && content.additional_creators.includes(userId))
  );
}

export function userLevel(client: MatrixClient, roomId: string, userId: string): number {
  if (isRoomCreator(client, roomId, userId)) return Number.POSITIVE_INFINITY;
  const levels = roomPowerLevels(client, roomId);
  return levels.users?.[userId] ?? levels.users_default ?? 0;
}

export function canWrite(client: MatrixClient, roomId: string): boolean {
  const levels = roomPowerLevels(client, roomId);
  const me = client.getUserId();
  if (!me || client.getRoom(roomId)?.getMyMembership() !== 'join') return false;
  // Synapse checks the *wire event type* m.room.encrypted, not plaintext m.room.message.
  return (
    userLevel(client, roomId, me) >=
    (levels.events?.['m.room.encrypted'] ?? levels.events_default ?? 0)
  );
}

export function isReadOnly(client: MatrixClient, roomId: string): boolean {
  const levels = roomPowerLevels(client, roomId);
  return (levels.events?.['m.room.encrypted'] ?? levels.events_default ?? 0) >= 50;
}

export async function assignChannelRole(
  client: MatrixClient,
  roomId: string,
  userId: string,
  role: ChannelRole,
): Promise<void> {
  if (isRoomCreator(client, roomId, userId))
    throw new Error('Нельзя менять роль создателя комнаты.');
  if (!client.getRoom(roomId)?.hasEncryptionStateEvent())
    throw new Error('Роли разрешены только в E2EE-каналах.');
  if (
    !client
      .getRoom(roomId)
      ?.getJoinedMembers()
      .some((member) => member.userId === userId)
  )
    throw new Error('Пользователь не состоит в канале.');
  // The homeserver denies upgrades by insufficiently privileged users.
  await client.setPowerLevel(roomId, userId, LEVEL[role]);
}

export async function setChannelReadOnly(
  client: MatrixClient,
  roomId: string,
  readOnly: boolean,
): Promise<void> {
  const room = client.getRoom(roomId);
  if (!room?.hasEncryptionStateEvent() || room.getMyMembership() !== 'join')
    throw new Error('Доступен только защищённый канал.');
  const levels = roomPowerLevels(client, roomId);
  const threshold = readOnly ? 50 : 0;
  await client.sendStateEvent(roomId, EventType.RoomPowerLevels, {
    ...levels,
    // All encrypted event kinds, including reactions and uploads, share this wire type.
    events_default: threshold,
    events: { ...levels.events, 'm.room.encrypted': threshold },
  });
}
