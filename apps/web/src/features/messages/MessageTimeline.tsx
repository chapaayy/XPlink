import { useEffect, useRef } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import { roomMessages } from '@xplink/matrix-adapter';

interface Props {
  client: MatrixClient;
  roomId: string;
  revision: number;
}

export function MessageTimeline({ client, roomId, revision }: Props) {
  const bottom = useRef<HTMLDivElement>(null);
  void revision;
  const messages = roomMessages(client, roomId);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomId, messages.length]);
  return (
    <section aria-label="Сообщения" className="timeline">
      {messages.length === 0 && (
        <p className="timeline-empty">
          Начало зашифрованной переписки. Сообщения увидят только участники с ключами.
        </p>
      )}
      {messages.map((message) => (
        <article className="message" key={message.id}>
          <div className="message-meta">
            <strong>{message.sender}</strong>
            <time>{new Date(message.timestamp).toLocaleTimeString()}</time>
          </div>
          <p className={message.decrypting ? 'muted' : ''}>{message.text}</p>
        </article>
      ))}
      <div ref={bottom} />
    </section>
  );
}
