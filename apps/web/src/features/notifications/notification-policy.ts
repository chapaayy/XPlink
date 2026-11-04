/** A conservative gate, kept pure for privacy regression tests. */
export interface NotificationSignal {
  optIn: boolean;
  permissionGranted: boolean;
  isHidden: boolean;
  isEncrypted: boolean;
  isIncoming: boolean;
  isLive: boolean;
  isDecrypted: boolean;
  isSupportedMessage: boolean;
}
export function shouldNotify(signal: NotificationSignal): boolean {
  return Object.values(signal).every(Boolean);
}
export const GENERIC_NOTIFICATION_BODY = 'Новое зашифрованное сообщение';
