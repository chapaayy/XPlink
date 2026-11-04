/** This stores only a non-sensitive opt-in bit, never Matrix identifiers or messages. */
const KEY = 'xplink.private-notifications.v1';
export function notificationOptIn(): boolean {
  try { return localStorage.getItem(KEY) === '1'; }
  catch { return false; }
}
export function saveNotificationOptIn(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    // Blocking browser storage must not block authenticated messaging.
  }
}
