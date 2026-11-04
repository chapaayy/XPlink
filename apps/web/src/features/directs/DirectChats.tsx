import { useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import { createDirectChat, directRoomMap } from '@xplink/matrix-adapter';

interface Props {
  client: MatrixClient;
  selectedRoomId: string | null;
  onSelect: (id: string) => void;
  revision: number;
}

export function DirectChats({ client, selectedRoomId, onSelect, revision }: Props) {
  const [peer, setPeer] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  void revision;
  const direct = directRoomMap(client);
  return (
    <section className="direct-chats" aria-label="Личные сообщения">
      <p className="section-label">Личные сообщения</p>
      {Object.entries(direct).flatMap(([userId, ids]) =>
        ids
          .filter((id) => client.getRoom(id)?.getMyMembership() === 'join')
          .map((id) => (
            <button
              key={id}
              className={id === selectedRoomId ? 'room-link selected' : 'room-link'}
              data-testid="dm-link"
              data-room-id={id}
              onClick={() => onSelect(id)}
            >
              <span>✉</span>
              {userId}
            </button>
          )),
      )}
      <form
        className="compact-form"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          setError('');
          void createDirectChat(client, peer)
            .then((id) => {
              setPeer('');
              onSelect(id);
            })
            .catch(() => setError('Не удалось открыть защищённый личный чат.'))
            .finally(() => setBusy(false));
        }}
      >
        <input
          aria-label="Matrix ID для личного сообщения"
          value={peer}
          onChange={(event) => setPeer(event.target.value)}
          placeholder="@user:localhost"
          required
        />
        <button type="submit" disabled={busy}>
          Начать личный чат
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  );
}
