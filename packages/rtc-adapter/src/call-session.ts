import type { MatrixClient } from 'matrix-js-sdk';
import { assertEncryptedRoom } from '@xplink/matrix-adapter';
import { discoverRtcTransport } from './transport';

export type CallKind = 'voice' | 'video';
export interface CallTarget {
  roomId: string;
  kind: CallKind;
  direct: boolean;
  intent: 'start' | 'join';
}

/**
 * Fail closed before mounting the upstream Element Call media client.
 * The upstream component owns MatrixRTC membership, per-sender E2EE key
 * distribution, LiveKit transport, microphone, video and screen sharing.
 */
export async function authorizeRtcCall(client: MatrixClient, target: CallTarget): Promise<void> {
  await assertEncryptedRoom(client, target.roomId);
  const room = client.getRoom(target.roomId);
  if (!room || room.getMyMembership() !== 'join') throw new Error('RTC_NOT_A_MEMBER');
  if (!client.getDeviceId() || !client.getUserId()) throw new Error('RTC_MISSING_DEVICE');
  await discoverRtcTransport(client);
}

/** Treat a missing or uncertain MatrixRTC state as NOT an active call. */
export function localCallIsJoined(joined: boolean, target: CallTarget | null): boolean {
  return Boolean(joined && target);
}
