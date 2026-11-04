import { useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import { createSpace, listSpaces, childRoomIds } from '@xplink/matrix-adapter';

interface Props {
  client: MatrixClient;
  activeSpace: string | null;
  onSelect: (spaceId: string | null) => void;
  revision: number;
}

export function WorkspaceRail({ client, activeSpace, onSelect, revision }: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  void revision;
  const spaces = listSpaces(client).filter(
    (space) =>
      !listSpaces(client).some(
        (parent) => parent.id !== space.id && childRoomIds(client, parent.id).includes(space.id),
      ),
  );
  return (
    <aside className="workspace-rail" aria-label="Пространства">
      <button
        className={'brand-logo compact ' + (!activeSpace ? 'rail-active' : '')}
        aria-label="Все каналы"
        onClick={() => onSelect(null)}
      >
        XP
      </button>
      <div className="rail-divider" />
      {spaces.map((space) => (
        <button
          key={space.id}
          data-testid="space-link"
          data-space-id={space.id}
          title={space.name}
          aria-label={'Пространство ' + space.name}
          className={'rail-pill ' + (activeSpace === space.id ? 'rail-active' : '')}
          onClick={() => onSelect(space.id)}
        >
          {space.name.slice(0, 2).toUpperCase()}
        </button>
      ))}
      <button
        className="rail-pill rail-create"
        aria-label="Создать пространство"
        onClick={() => setCreating((value) => !value)}
      >
        +
      </button>
      {creating && (
        <form
          className="rail-popover"
          onSubmit={(event) => {
            event.preventDefault();
            setBusy(true);
            setError('');
            void createSpace(client, name)
              .then((id) => {
                setCreating(false);
                setName('');
                onSelect(id);
              })
              .catch(() => setError('Не удалось создать пространство.'))
              .finally(() => setBusy(false));
          }}
        >
          <label htmlFor="space-name">Название пространства</label>
          <input
            id="space-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Моя команда"
            required
          />
          <button type="submit" disabled={busy}>
            Создать
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
    </aside>
  );
}
