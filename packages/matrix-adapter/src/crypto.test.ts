import { describe, it, expect, vi } from 'vitest';
import type { MatrixClient } from 'matrix-js-sdk';
import { assertEncryptedRoom } from './crypto';
import { sendEncryptedMessage } from './messages';

function fakeClient(encrypted: boolean, initialized: boolean) {
  const sendEvent = vi.fn();
  const client = {
    getRoom: () => ({
      getMyMembership: () => 'join',
      hasEncryptionStateEvent: () => encrypted,
      getJoinedMembers: () => [],
    }),
    getCrypto: () => (initialized ? { isEncryptionEnabledInRoom: async () => encrypted } : null),
    sendEvent,
  } as unknown as MatrixClient;
  return { client, sendEvent };
}

describe('fail-closed E2EE send', () => {
  it('rejects unencrypted rooms and never uploads plaintext', async () => {
    const { client, sendEvent } = fakeClient(false, true);
    await expect(sendEncryptedMessage(client, '!room:test', 'SECRETTEXT')).rejects.toThrow('E2EE');
    expect(sendEvent).not.toHaveBeenCalled();
  });
  it('rejects missing crypto without sending', async () => {
    const { client, sendEvent } = fakeClient(true, false);
    await expect(sendEncryptedMessage(client, '!room:test', 'SECRETTEXT')).rejects.toThrow('E2EE');
    expect(sendEvent).not.toHaveBeenCalled();
  });
  it('only allows send after both E2EE signals confirm', async () => {
    const { client, sendEvent } = fakeClient(true, true);
    await expect(assertEncryptedRoom(client, '!room:test')).resolves.toBeUndefined();
    await sendEncryptedMessage(client, '!room:test', 'safe');
    expect(sendEvent).toHaveBeenCalledOnce();
  });
});
