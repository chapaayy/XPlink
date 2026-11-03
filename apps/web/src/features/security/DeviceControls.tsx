import { useEffect, useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import { listOwnDevices, revokeDevice } from '@xplink/matrix-adapter';
import type { OwnDevice } from '@xplink/matrix-adapter';

export function DeviceControls({ client }: { client: MatrixClient }) {
  const [devices, setDevices] = useState<OwnDevice[]>([]);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const refresh = async () => setDevices(await listOwnDevices(client));
  useEffect(() => { void refresh().catch(() => setNotice('Список устройств недоступен.')); }, [client]);
  const revoke = async (deviceId: string) => {
    if (!window.confirm('Отозвать доступ устройства? Новые сообщения перестанут синхронизироваться.')) return;
    setBusy(true); setNotice('');
    try { await revokeDevice(client, deviceId, password); await refresh(); setPassword(''); }
    catch { setNotice('Отзыв не выполнен. Проверьте пароль и повторите.'); }
    finally { setBusy(false); }
  };
  return <section className="security-section">
    <h2>Активные устройства</h2>
    <button className="neutral-button" onClick={() => void refresh().catch(() => setNotice('Ошибка обновления.'))}>Обновить список</button>
    <label htmlFor="revoke-password">Пароль для отзыва устройства</label>
    <input id="revoke-password" type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)}/>
    {devices.map((device) => <div className="device-item" key={device.deviceId}>
      <strong>{device.displayName} {device.current ? '(это устройство)' : ''}</strong>
      <small>{device.deviceId} · {device.verified ? 'Подтверждено' : 'Не проверено'}</small>
      {device.lastSeen && <small>Последний доступ: {new Date(device.lastSeen).toLocaleString()}</small>}
      {!device.current && <button className="danger-button" disabled={busy || !password} onClick={() => void revoke(device.deviceId)}>Отозвать сессию</button>}
    </div>)}
    {notice && <p role="status">{notice}</p>}
  </section>;
}
