import { useState } from 'react';
import { notificationOptIn, saveNotificationOptIn } from './preferences';

export function NotificationSettings() {
  const supported = typeof Notification !== 'undefined' && window.isSecureContext;
  const [enabled, setEnabled] = useState(() => notificationOptIn());
  const [permission, setPermission] = useState(() =>
    supported ? Notification.permission : 'unsupported',
  );
  const [error, setError] = useState('');
  const disable = () => {
    saveNotificationOptIn(false);
    setEnabled(false);
    setError('');
  };
  const enable = async () => {
    if (!supported) return;
    setError('');
    try {
      // Request permission only from the direct button click. Never on mount.
      const result =
        Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        disable();
        setError('Разрешение не получено. Проверьте настройки браузера.');
        return;
      }
      saveNotificationOptIn(true);
      setEnabled(true);
    } catch {
      disable();
      setError('Не удалось включить уведомления в этом браузере.');
    }
  };
  return (
    <section className="security-section" aria-label="Уведомления">
      <h2>Уведомления</h2>
      <p>
        По умолчанию выключены. Показываются только при открытом XPlink в фоновой вкладке. В
        уведомлении нет текста, имени отправителя и названия комнаты.
      </p>
      <p className="muted">
        Разрешение браузера:{' '}
        {permission === 'granted'
          ? 'разрешено'
          : permission === 'denied'
            ? 'запрещено'
            : permission === 'default'
              ? 'не запрошено'
              : 'не поддерживается'}
        .
      </p>
      {enabled && permission === 'granted' ? (
        <button type="button" className="neutral-button" onClick={disable}>
          Выключить уведомления
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void enable()}
          disabled={!supported || permission === 'denied'}
        >
          Включить уведомления
        </button>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
