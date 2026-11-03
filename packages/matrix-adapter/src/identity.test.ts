import { describe, it, expect, vi } from 'vitest';
import type { MatrixClient } from 'matrix-js-sdk';
import { assertStableRoomIdentities, removeRoomMember } from './identity';
import { sendEncryptedMessage } from './messages';

function build(changed: boolean, canKick: boolean) {
  const sendEvent = vi.fn();
  const kick = vi.fn(async () => {
    if (!canKick) throw new Error('403');
  });
  const forceDiscardSession = vi.fn(async () => {});
  const crypto = {
    isEncryptionEnabledInRoom: async () => true,
    getUserVerificationStatus: async () => ({
      needsUserApproval: changed,
      isVerified: () => false,
    }),
    forceDiscardSession,
  };
  const room = {
    getMyMembership: () => 'join',
    hasEncryptionStateEvent: () => true,
    getJoinedMembers: () => [{ userId: '@self:localhost' }, { userId: '@peer:localhost' }],
  };
  const client = {
    getCrypto: () => crypto,
    getRoom: () => room,
    getUserId: () => '@self:localhost',
    sendEvent,
    kick,
  } as unknown as MatrixClient;
  return { client, kick, sendEvent, forceDiscardSession };
}
describe('stage 2 identity changes and membership', () => {
  it('blocks sending on changed identity before upload', async () => {
    const { client, sendEvent } = build(true, true);
    await expect(sendEncryptedMessage(client, '!room:localhost', 'do-not-leak')).rejects.toThrow(
      'Идентичность',
    );
    expect(sendEvent).not.toHaveBeenCalled();
  });
  it('permits stable but unverified first-use devices with visible trust UI', async () => {
    const { client } = build(false, true);
    await expect(assertStableRoomIdentities(client, '!room:localhost')).resolves.toBeUndefined();
  });
  it('discards the outbound Megolm session after server-approved removal', async () => {
    const { client, kick, forceDiscardSession } = build(false, true);
    await removeRoomMember(client, '!room:localhost', '@peer:localhost');
    expect(kick).toHaveBeenCalledOnce();
    expect(forceDiscardSession).toHaveBeenCalledWith('!room:localhost');
  });
  it('does not claim removal/rotation if server rejects it', async () => {
    const { client, forceDiscardSession } = build(false, false);
    await expect(removeRoomMember(client, '!room:localhost', '@peer:localhost')).rejects.toThrow(
      '403',
    );
    expect(forceDiscardSession).not.toHaveBeenCalled();
  });
});
