import { useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import {
  sendEncryptedMessage,
  sendEncryptedAttachment,
  canWrite,
  MAX_ATTACHMENT_BYTES,
} from '@xplink/matrix-adapter';

interface Props {
  client: MatrixClient;
  roomId: string;
}

export function Composer({ client, roomId }: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const writable = canWrite(client, roomId);
  return (
    <form
      className="composer"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!text.trim() || !writable) return;
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
      {!writable && (
        <p className="trust-warning" role="status">
          Канал доступен только для чтения: право отправки проверяет сервер.
        </p>
      )}
      <div className="composer-bar">
        <input
          aria-label="Сообщение"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать зашифрованное сообщение…"
        />
        <button type="submit" disabled={busy || !text.trim() || !writable}>
          Отправить
        </button>
      </div>
      <label className="attachment-picker">
        📎 Прикрепить зашифрованный файл (до 10 МБ)
        <input
          type="file"
          aria-label="Зашифрованное вложение"
          disabled={busy || !writable}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            if (file.size > MAX_ATTACHMENT_BYTES) {
              setError('Размер файла не должен превышать 10 МБ.');
              return;
            }
            setBusy(true);
            setError('');
            void sendEncryptedAttachment(client, roomId, file)
              .catch(() => setError('Не удалось зашифровать или отправить вложение.'))
              .finally(() => setBusy(false));
          }}
        />
      </label>
    </form>
  );
}
