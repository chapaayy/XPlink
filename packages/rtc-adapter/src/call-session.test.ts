import { describe, expect, it, vi } from 'vitest';
import type { MatrixClient } from 'matrix-js-sdk';
import { authorizeRtcCall } from './call-session';
import { isTrustedRtcUrl } from './transport';

describe('stage-4 fail-closed RTC boundary', () => {
  const call = {
    roomId: '!r:localhost',
    kind: 'voice' as const,
    direct: false,
    intent: 'start' as const,
  };
  it('refuses an unencrypted room even when transport exists', async () => {
    const client = {
      getRoom: () => ({ getMyMembership: () => 'join', hasEncryptionStateEvent: () => false }),
      getCrypto: () => ({ isEncryptionEnabledInRoom: async () => false }),
      getDeviceId: () => 'D',
      getUserId: () => '@a:localhost',
    } as unknown as MatrixClient;
    const fetcher = vi.spyOn(globalThis, 'fetch');
    await expect(authorizeRtcCall(client, call)).rejects.toThrow('E2EE');
    expect(fetcher).not.toHaveBeenCalled();
    fetcher.mockRestore();
  });
  it('requires real membership, not merely a room id', async () => {
    const client = { getRoom: () => null } as unknown as MatrixClient;
    await expect(authorizeRtcCall(client, call)).rejects.toThrow();
  });
  it('disallows plaintext remote focus and insecure credentials in focus URL', () => {
    expect(isTrustedRtcUrl('http://example.org/livekit/jwt', 'https://example.org')).toBe(false);
    expect(isTrustedRtcUrl('https://evil:pw@example.org/jwt', 'https://example.org')).toBe(false);
    expect(isTrustedRtcUrl('https://example.org/jwt', 'https://example.org')).toBe(true);
    expect(isTrustedRtcUrl('http://localhost:8080/livekit/jwt', 'http://localhost:8080')).toBe(
      true,
    );
  });
});
