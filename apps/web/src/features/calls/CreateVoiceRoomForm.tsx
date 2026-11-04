import { useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import { createVoiceRoom } from '@xplink/matrix-adapter';
interface Props {
  client: MatrixClient;
  onCreated: (roomId: string) => void;
}
export function CreateVoiceRoomForm({ client, onCreated }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [invitee, setInvitee] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="voice-room-create">
      <button type="button" className="voice-room-toggle" onClick={() => setExpanded(!expanded)}>
        ＋ Голосовой канал
      </button>
      {expanded && (
        <form
          className="compact-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError('');
            try {
              const roomId = await createVoiceRoom(client, name, invitee);
              setName('');
              setInvitee('');
              setExpanded(false);
              onCreated(roomId);
            } catch {
              setError('Не удалось создать защищённый голосовой канал.');
            } finally {
              setBusy(false);
            }
          }}
        >
          <label htmlFor="voice-room-name">Название голосового канала</label>
          <input
            id="voice-room-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            aria-label="Matrix ID в голосовой канал"
            value={invitee}
            onChange={(e) => setInvitee(e.target.value)}
            placeholder="@user:localhost (необязательно)"
          />
          <button type="submit" disabled={busy || !name.trim()}>
            Создать голосовой канал
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
    </div>
  );
}
