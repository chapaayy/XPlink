import type { MatrixClient } from 'matrix-js-sdk';

export interface PeerIdentity {
  userId: string;
  verified: boolean;
  changed: boolean;
}

export async function roomIdentities(
  client: MatrixClient,
  roomId: string,
): Promise<PeerIdentity[]> {
  const crypto = client.getCrypto();
  const room = client.getRoom(roomId);
  if (!crypto || !room) throw new Error('Нет Matrix Crypto или комнаты.');
  const myId = client.getUserId();
  return Promise.all(
    room
      .getJoinedMembers()
      .filter((member) => member.userId !== myId)
      .map(async (member) => {
        const status = await crypto.getUserVerificationStatus(member.userId);
        return {
          userId: member.userId,
          verified: status.isVerified(),
          changed: status.needsUserApproval,
        };
      }),
  );
}

/** Changing an already known identity must be acknowledged by actual verification. */
export async function assertStableRoomIdentities(
  client: MatrixClient,
  roomId: string,
): Promise<void> {
  const peers = await roomIdentities(client, roomId);
  if (peers.some((peer) => peer.changed)) {
    throw new Error('Идентичность участника изменилась: перепроверьте его перед отправкой.');
  }
}

/** Matrix server enforces moderation rights; discard outbound Megolm session after kick. */
export async function removeRoomMember(
  client: MatrixClient,
  roomId: string,
  userId: string,
): Promise<void> {
  const room = client.getRoom(roomId);
  const crypto = client.getCrypto();
  if (!room || !crypto || room.getMyMembership() !== 'join') {
    throw new Error('Нет доступа к защищённой комнате.');
  }
  if (!userId || userId === client.getUserId()) throw new Error('Неверный участник.');
  await client.kick(roomId, userId);
  await crypto.forceDiscardSession(roomId);
}
