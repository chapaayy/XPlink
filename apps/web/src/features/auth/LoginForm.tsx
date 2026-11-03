import { useState } from 'react';

interface Props {
  onLogin: (user: string, password: string) => Promise<void>;
  error: string;
  busy: boolean;
}

export function LoginForm({ onLogin, error, busy }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <main className="auth-page">
      <form
        className="auth-card"
        onSubmit={(event) => {
          event.preventDefault();
          void onLogin(username, password);
        }}
      >
        <div className="brand-logo">XP</div>
        <h1>XPlink</h1>
        <p>Приватный E2EE-мессенджер · тестовый этап 2</p>
        <label htmlFor="username">Логин Matrix</label>
        <input
          id="username"
          value={username}
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
          placeholder="alice"
          required
        />
        <label htmlFor="password">Пароль</label>
        <input
          id="password"
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button disabled={busy} type="submit">
          {busy ? 'Вход…' : 'Войти'}
        </button>
        <small>
          Регистрация закрыта. Создать аккаунт можно только через администратора Synapse.
        </small>
        <small>
          Ключи хранятся на этом устройстве. Не удаляйте данные браузера: восстановление ключей
          доступно в настройках безопасности после входа.
        </small>
      </form>
    </main>
  );
}
