import { useEffect } from 'react';
import type { MatrixClient, MatrixEvent } from 'matrix-js-sdk';
import { EventType, MatrixEventEvent, RoomEvent } from 'matrix-js-sdk';
import { notificationOptIn } from './preferences';
import { GENERIC_NOTIFICATION_BODY, shouldNotify } from './notification-policy';

/** The OS never receives plaintext, user IDs, room IDs or event IDs. */
async function deliverGenericNotification(): Promise<void> {
  try {
    const registration = 'serviceWorker' in navigator
      ? await navigator.serviceWorker.getRegistration()
      : undefined;
    if (registration?.active) {
      await registration.showNotification('XPlink', {
        body: GENERIC_NOTIFICATION_BODY,
        icon: '/icons/xplink-192.png',
        tag: 'xplink-new-message',
        silent: true,
      });
      return;
    }
    // Desktop fallback only. Some mobile browsers require the SW path above.
    const note = new Notification('XPlink', {
      body: GENERIC_NOTIFICATION_BODY,
      icon: '/icons/xplink-192.png',
      tag: 'xplink-new-message',
      silent: true,
    });
    note.onclick = () => { window.focus(); note.close(); };
  } catch {
    // Notifications are best-effort; never log message metadata or throw.
  }
}

export function usePrivateNotifications(client: MatrixClient): void {
  useEffect(() => {
    const startedAt = Date.now();
    let lastSent = 0;
    const seen = new Set<string>();
    const pending = new Map<MatrixEvent, () => void>();
    const onTimeline = (event: MatrixEvent, _room: unknown, toStartOfTimeline?: boolean) => {
      const id = event.getId();
      if (!id || !id.startsWith('$') || seen.has(id)) return;
      seen.add(id);
      if (seen.size > 500) seen.delete(seen.values().next().value!);
      if (toStartOfTimeline || event.getTs() < startedAt - 15_000) return;
      const finish = () => {
        const handler = pending.get(event);
        if (handler) {
          event.off(MatrixEventEvent.Decrypted, handler);
          pending.delete(event);
        }
        if (!('Notification' in window)) return;
        const now = Date.now();
        const content = event.getContent();
        const accepted = shouldNotify({
          optIn: notificationOptIn(),
          permissionGranted: Notification.permission === 'granted',
          isHidden: document.visibilityState === 'hidden',
          isEncrypted: event.getWireType() === 'm.room.encrypted',
          isIncoming: event.getSender() !== client.getUserId() && !!event.getSender(),
          isLive: now - event.getTs() < 60_000,
          isDecrypted: event.getType() === EventType.RoomMessage && !event.isDecryptionFailure(),
          isSupportedMessage: content.msgtype === 'm.text' || content.msgtype === 'm.file',
        });
        if (!accepted || now - lastSent < 2500) return;
        lastSent = now;
        void deliverGenericNotification();
      };
      if (event.getType() === 'm.room.encrypted') {
        const handler = () => finish();
        pending.set(event, handler);
        event.on(MatrixEventEvent.Decrypted, handler);
      } else finish();
    };
    client.on(RoomEvent.Timeline, onTimeline);
    return () => {
      client.off(RoomEvent.Timeline, onTimeline);
      for (const [event, handler] of pending) event.off(MatrixEventEvent.Decrypted, handler);
      pending.clear();
    };
  }, [client]);
}
