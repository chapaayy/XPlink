import { useState } from 'react';
import type { StoredSession } from '@xplink/matrix-adapter';
import {
  clearSession,
  passwordLogin,
  readSession,
  storeSession,
  SecretStorageAccess,
} from '@xplink/matrix-adapter';
import { LoginForm } from '../features/auth/LoginForm';
import { AppShell } from '../layouts/AppShell';
import { useMatrix } from './use-matrix';

export function App() {
  const [secretAccess] = useState(() => new SecretStorageAccess());
  const [session, setSession] = useState<StoredSession | null>(() => readSession());
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const { client, status, error, revision } = useMatrix(session, secretAccess);

  const login = async (user: string, password: string) => {
    setBusy(true);
    setAuthError('');
    try {
      const account = await passwordLogin(window.location.origin, user, password);
      storeSession(account);
      setSession(account);
    } catch {
      setAuthError('Не удалось войти. Проверьте имя пользователя, пароль и доступность сервера.');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    // Prevent the disconnected UI from retaining access to session secrets.
    try {
      await client?.logout();
    } finally {
      secretAccess.clear();
      clearSession();
      setSession(null);
      location.reload();
    }
  };

  if (!session) return <LoginForm onLogin={login} error={authError} busy={busy} />;
  if (status !== 'ready' || !client) {
    return (
      <main className="connection-screen">
        <div className="brand-logo">XP</div>
        <h1>XPlink</h1>
        <p>{status === 'blocked' || status === 'error' ? error : 'Подключение и запуск E2EE…'}</p>
        <button onClick={() => location.reload()}>Повторить</button>
        <p className="muted">
          В этапе 1 recovery key и подтверждение новых устройств ещё не реализованы.
        </p>
      </main>
    );
  }
  return (
    <AppShell
      client={client}
      revision={revision}
      userId={session.userId}
      onLogout={logout}
      secretAccess={secretAccess}
    />
  );
}
