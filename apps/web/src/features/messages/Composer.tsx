import { useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import { sendEncryptedMessage } from '@xplink/matrix-adapter';

interface Props {
  client: MatrixClient;
  roomId: string;
}

export function Composer({ client, roomId }: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <form
      className="composer"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!text.trim()) return;
        setBusy(true);
        setError('');
        try {
          await sendEncryptedMessage(client, roomId, text);
          setText('');
        } catch {
          setError(
            'Сообщение не отправлено: сервер или E2EE недоступен. Никакого plaintext fallback.',
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="composer-bar">
        <input
          aria-label="Сообщение"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать зашифрованное сообщение…"
        />
        <button type="submit" disabled={busy || !text.trim()}>
          Отправить
        </button>
      </div>
    </form>
  );
}
