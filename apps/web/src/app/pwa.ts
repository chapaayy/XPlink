/** Register only the offline *public* shell. Never cache crypto/session state. */
export function registerOfflineShell(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !window.isSecureContext) return;
  window.addEventListener(
    'load',
    () => {
      void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Offline shell is optional; do not prevent Matrix or Rust Crypto startup.
      });
    },
    { once: true },
  );
}
