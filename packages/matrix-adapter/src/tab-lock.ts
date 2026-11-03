/** A Web Lock prevents two tabs from simultaneously corrupting Rust Crypto IndexedDB. */
export async function acquireCryptoTab(): Promise<(() => void) | null> {
  if (!navigator.locks) return null; // fail closed, not an unsafe fallback
  return new Promise((resolve, reject) => {
    void navigator.locks
      .request('xplink-single-rust-crypto-owner', { ifAvailable: true }, async (lock) => {
        if (!lock) {
          resolve(null);
          return;
        }
        await new Promise<void>((release) => resolve(release));
      })
      .catch(reject);
  });
}
