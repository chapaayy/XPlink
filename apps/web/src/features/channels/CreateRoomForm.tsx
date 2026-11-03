import { useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import { createEncryptedRoom } from '@xplink/matrix-adapter';

interface Props {
  client: MatrixClient;
  onCreated: (roomId: string) => void;
}

export function CreateRoomForm({ client, onCreated }: Props) {
  const [name, setName] = useState('');
  const [invitee, setInvitee] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="room-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
          const id = await createEncryptedRoom(client, name, invitee);
          setName('');
          setInvitee('');
          onCreated(id);
        } catch {
          setError('Не удалось создать защищённую комнату. Проверьте Matrix ID приглашённого.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="room-name">Новый E2EE-канал</label>
      <input
        id="room-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название канала"
        required
      />
      <input
        aria-label="Matrix ID участника"
        value={invitee}
        onChange={(e) => setInvitee(e.target.value)}
        placeholder="@bob:localhost"
      />
      <button disabled={busy} type="submit">
        {busy ? 'Создание…' : 'Создать защищённый канал'}
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </form>
  );
}
