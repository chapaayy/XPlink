import { describe, it, expect, vi } from 'vitest';
import type { MatrixClient } from 'matrix-js-sdk';
import { SecretStorageAccess } from './secret-storage';
import { createRecovery } from './recovery';
import { revokeDevice } from './devices';

describe('recovery keys and revocation safeguards', () => {
  it('keeps raw keys in memory and clears them deterministically', async () => {
    const access = new SecretStorageAccess();
    const source = new Uint8Array([1, 2, 3]);
    access.setRawKey(source);
    source.fill(0);
    const before = await access.callbacks.getSecretStorageKey?.({ keys: { key1: {} } }, 'test');
    expect(Array.from(before?.[1] ?? [])).toEqual([1, 2, 3]);
    access.clear();
    const after = await access.callbacks.getSecretStorageKey?.({ keys: { key1: {} } }, 'test');
    expect(after).toBeNull();
  });
  it('never overwrites existing cross-signing or secret storage', async () => {
    const create = vi.fn();
    const client = { getCrypto: () => ({
      isSecretStorageReady: async () => true, createRecoveryKeyFromPassphrase: create,
    }) } as unknown as MatrixClient;
    await expect(createRecovery(client, new SecretStorageAccess(), 'secret')).rejects.toThrow('существуют');
    expect(create).not.toHaveBeenCalled();
  });
  it('requires password and forbids self-device revocation', async () => {
    const deleteDevice = vi.fn();
    const client = {
      getDeviceId: () => 'here',
      getUserId: () => '@alice:localhost',
      deleteDevice,
    } as unknown as MatrixClient;
    await expect(revokeDevice(client, 'here', 'test')).rejects.toThrow('Выйти');
    await expect(revokeDevice(client, 'other', '')).rejects.toThrow('пароль');
    expect(deleteDevice).not.toHaveBeenCalled();
  });
});
