import { useEffect, useRef, useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import { addReaction, downloadEncryptedAttachment, roomMessages } from '@xplink/matrix-adapter';
import type { ChatAttachment } from '@xplink/matrix-adapter';

interface Props {
  client: MatrixClient;
  roomId: string;
  revision: number;
}

export function MessageTimeline({ client, roomId, revision }: Props) {
  const bottom = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  void revision;
  const messages = roomMessages(client, roomId);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
    setError('');
  }, [roomId, messages.length]);

  const download = async (attachment: ChatAttachment) => {
    try {
      setError('');
      const blob = await downloadEncryptedAttachment(client, attachment);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = attachment.name;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
    } catch {
      setError('Не удалось скачать или проверить зашифрованное вложение.');
    }
  };

  return (
    <section aria-label="Сообщения" className="timeline">
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {messages.length === 0 && (
        <p className="timeline-empty">
          Начало защищённой переписки. Сервер не получает текст сообщений.
        </p>
      )}
      {messages.map((message) => (
        <article className="message" key={message.id} data-event-id={message.id}>
          <div className="message-meta">
            <strong>{message.sender}</strong>
            <time>{new Date(message.timestamp).toLocaleTimeString()}</time>
          </div>
          {message.attachment ? (
            <div className="file-message">
              <span>🔒 {message.attachment.name}</span>
              <small>{Math.round(message.attachment.size / 1024)} КБ · E2EE файл</small>
              <button
                aria-label={'Скачать ' + message.attachment.name}
                onClick={() => void download(message.attachment!)}
              >
                Скачать и расшифровать
              </button>
            </div>
          ) : (
            <p className={message.decrypting ? 'muted' : ''}>{message.text}</p>
          )}
          {!message.decrypting && message.id.startsWith('$') && (
            <div className="reaction-bar">
              {message.reactions.map((reaction) => (
                <span
                  key={reaction.emoji}
                  className={reaction.mine ? 'reaction reaction-mine' : 'reaction'}
                >
                  {reaction.emoji} {reaction.count}
                </span>
              ))}
              {['👍', '❤️', '😂'].map((emoji) => (
                <button
                  key={emoji}
                  aria-label={'Реакция ' + emoji}
                  onClick={() =>
                    void addReaction(client, roomId, message.id, emoji).catch(() =>
                      setError('Реакцию не удалось отправить; проверьте права и E2EE.'),
                    )
                  }
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </article>
      ))}
      <div ref={bottom} />
    </section>
  );
}
