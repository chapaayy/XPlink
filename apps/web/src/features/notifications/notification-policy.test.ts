import { describe, expect, it } from 'vitest';
import { GENERIC_NOTIFICATION_BODY, shouldNotify } from './notification-policy';
import type { NotificationSignal } from './notification-policy';
const all: NotificationSignal = {
  optIn: true,
  permissionGranted: true,
  isHidden: true,
  isEncrypted: true,
  isIncoming: true,
  isLive: true,
  isDecrypted: true,
  isSupportedMessage: true,
};
describe('private notification gate', () => {
  it('shows only hidden-window, consented, decrypted incoming encrypted live events', () => {
    expect(shouldNotify(all)).toBe(true);
    for (const key of Object.keys(all) as (keyof NotificationSignal)[]) {
      expect(shouldNotify({ ...all, [key]: false })).toBe(false);
    }
  });
  it('never includes sender, room, file or message content in the OS notification', () => {
    expect(GENERIC_NOTIFICATION_BODY).toBe('Новое зашифрованное сообщение');
    expect(JSON.stringify({ title: 'XPlink', body: GENERIC_NOTIFICATION_BODY })).not.toMatch(
      /alice|bob|secret|@|roomId/i,
    );
  });
});
