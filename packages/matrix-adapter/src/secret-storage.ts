import { decodeRecoveryKey } from 'matrix-js-sdk/lib/crypto-api';
import type { CryptoCallbacks } from 'matrix-js-sdk/lib/crypto-api';

/**
 * In-memory, short-lived recovery key access. No localStorage, sessionStorage,
 * analytics, API calls or logging of secret storage keys. Matrix SDK owns crypto.
 */
export class SecretStorageAccess {
  private secret: Uint8Array | null = null;

  readonly callbacks: CryptoCallbacks = {
    cacheSecretStorageKey: (_keyId, _keyInfo, key) => {
      this.setRawKey(key);
    },
    getSecretStorageKey: async ({ keys }) => {
      const keyId = Object.keys(keys)[0];
      if (!keyId || !this.secret) return null;
      return [keyId, new Uint8Array(this.secret)];
    },
  };

  setRawKey(raw: Uint8Array): void {
    this.clear();
    this.secret = new Uint8Array(raw);
  }

  unlock(encoded: string): void {
    // The official Matrix recovery key includes checksum validation.
    const decoded = decodeRecoveryKey(encoded.trim());
    this.setRawKey(decoded);
    decoded.fill(0);
  }

  clear(): void {
    this.secret?.fill(0);
    this.secret = null;
  }

  get unlocked(): boolean {
    return this.secret !== null;
  }
}
