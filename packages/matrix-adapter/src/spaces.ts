import type { MatrixClient, Room } from 'matrix-js-sdk';
import { EventType, Preset, Visibility } from 'matrix-js-sdk';
import { createEncryptedRoom } from './rooms';

export interface SpaceSummary {
  id: string;
  name: string;
  membership: string;
}

/** Space and category rooms contain navigation metadata, never message bodies. */
export function isSpace(room: Room): boolean {
  return room.currentState.getStateEvents('m.room.create', '')?.getContent().type === 'm.space';
}

export function listSpaces(client: MatrixClient): SpaceSummary[] {
  return client
    .getRooms()
    .filter((room) => isSpace(room) && ['join', 'invite'].includes(room.getMyMembership()))
    .map((room) => ({ id: room.roomId, name: room.name, membership: room.getMyMembership() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function childRoomIds(client: MatrixClient, spaceId: string): string[] {
  const parent = client.getRoom(spaceId);
  if (!parent || !isSpace(parent) || parent.getMyMembership() !== 'join') return [];
  const events = parent.currentState.getStateEvents('m.space.child');
  return events
    .filter((event) => Array.isArray(event.getContent().via) && event.getContent().via.length)
    .map((event) => event.getStateKey() ?? '')
    .filter((id) => !!id && client.getRoom(id)?.getMyMembership() === 'join');
}

/** Matrix v12 room IDs are opaque; never derive server names from a room ID. */
function localVia(client: MatrixClient): string {
  const domain = client.getDomain();
  if (!domain) throw new Error('LOCAL_HOMESERVER_UNAVAILABLE');
  return domain;
}

async function linkChild(client: MatrixClient, parentId: string, childId: string): Promise<void> {
  const parent = client.getRoom(parentId);
  if (!parent || !isSpace(parent) || parent.getMyMembership() !== 'join') {
    throw new Error('SPACE_PARENT_NOT_JOINED');
  }
  // Space linkage remains regular Matrix state, validated by server power levels.
  // Matrix v12 room IDs are opaque: via identifies the user's local homeserver.
  await client.sendStateEvent(parentId, EventType.SpaceChild, { via: [localVia(client)] }, childId);
  await client.sendStateEvent(
    childId,
    EventType.SpaceParent,
    { via: [localVia(client)], canonical: true },
    parentId,
  );
}

export async function createSpace(client: MatrixClient, name: string): Promise<string> {
  if (!client.getCrypto()) throw new Error('Необходимо инициализировать Rust Crypto.');
  if (!name.trim()) throw new Error('Укажите название пространства.');
  const result = await client.createRoom({
    name: name.trim(),
    visibility: Visibility.Private,
    preset: Preset.PrivateChat,
    creation_content: { type: 'm.space' },
  });
  return result.room_id;
}

export async function createCategory(
  client: MatrixClient,
  parentId: string,
  name: string,
): Promise<string> {
  const id = await createSpace(client, name);
  await linkChild(client, parentId, id);
  return id;
}

export async function createSpaceChannel(
  client: MatrixClient,
  parentId: string,
  name: string,
  invitee = '',
): Promise<string> {
  const id = await createEncryptedRoom(client, name, invitee);
  await linkChild(client, parentId, id);
  return id;
}

export async function inviteToSpace(
  client: MatrixClient,
  spaceId: string,
  userId: string,
): Promise<void> {
  const space = client.getRoom(spaceId);
  if (!space || !isSpace(space) || space.getMyMembership() !== 'join')
    throw new Error('Нет пространства.');
  if (!/^@[^:\s]+:.+/.test(userId)) throw new Error('Некорректный Matrix ID.');
  await client.invite(spaceId, userId);
}
