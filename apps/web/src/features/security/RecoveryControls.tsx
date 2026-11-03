import { useEffect, useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import { createRecovery, getRecoveryStatus, recoverDevice } from '@xplink/matrix-adapter';
import type { RecoveryStatus, SecretStorageAccess } from '@xplink/matrix-adapter';

interface Props { client: MatrixClient; secretAccess: SecretStorageAccess }

export function RecoveryControls({ client, secretAccess }: Props) {
  const [status, setStatus] = useState<RecoveryStatus | null>(null);
  const [password, setPassword] = useState('');
  const [providedKey, setProvidedKey] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const refresh = async () => setStatus(await getRecoveryStatus(client));
  useEffect(() => { void refresh().catch(() => setNotice('Не удалось прочитать статус ключей.')); }, [client]);
  const action = async (fn: () => Promise<void>) => {
    setBusy(true);
    setNotice('');
    try { await fn(); await refresh(); }
    catch { setNotice('Операция с ключами не удалась; изменения не подтверждены.'); }
    finally { setPassword(''); setProvidedKey(''); setBusy(false); }
  };
  return <section className="security-section">
    <h2>Ключи и восстановление</h2>
    <p>Хранилище: {status?.secretStorage ? 'настроено' : 'не настроено'} · Подписи: {status?.crossSigning ? 'есть' : 'нет'} · Backup: {status?.keyBackup ? 'есть' : 'нет'}</p>
    {!status?.secretStorage && !generatedKey && <>
      <p>Создать recovery key. Сохраните его вне браузера: сервер не сможет восстановить историю без ключа.</p>
      <label htmlFor="recovery-password">Пароль аккаунта для первичной настройки</label>
      <input id="recovery-password" type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button disabled={busy || !password} onClick={() => void action(async () => { setGeneratedKey(await createRecovery(client, secretAccess, password)); })}>Создать recovery key</button>
    </>}
    {generatedKey && <div>
      <p>Сохраните ключ в надёжное место. XPlink не будет показывать его автоматически.</p>
      <div className="security-key" data-testid="generated-recovery-key">{generatedKey}</div>
      <button onClick={() => setGeneratedKey('')}>Я сохранил ключ</button>
    </div>}
    {status?.secretStorage && <form onSubmit={(e) => { e.preventDefault(); void action(async () => {
      const result = await recoverDevice(client, secretAccess, providedKey);
      setNotice(`Восстановлено ключей: ${result.imported} из ${result.total}`);
    }); }}>
      <label htmlFor="recovery-key-input">Recovery key для нового устройства</label>
      <input id="recovery-key-input" type="password" autoComplete="off" value={providedKey} onChange={(e) => setProvidedKey(e.target.value)} />
      <button disabled={busy || !providedKey} type="submit">Восстановить историю и доверие</button>
    </form>}
    <button className="neutral-button" onClick={() => { secretAccess.clear(); setNotice('Ключ удалён из памяти этой вкладки.'); }}>Заблокировать recovery key</button>
    {notice && <p role="status">{notice}</p>}
  </section>;
}
