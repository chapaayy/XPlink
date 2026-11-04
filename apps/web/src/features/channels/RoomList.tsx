import { useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import { acceptRoomInvite, listRooms, isVoiceRoom } from '@xplink/matrix-adapter';

interface Props {
  client: MatrixClient;
  selectedRoomId: string | null;
  onSelect: (id: string) => void;
  revision: number;
  roomIds?: string[];
  hideRoomIds?: string[];
  showInvites?: boolean;
}

export function RoomList({
  client,
  selectedRoomId,
  onSelect,
  revision,
  roomIds,
  hideRoomIds,
  showInvites = true,
}: Props) {
  const [error, setError] = useState('');
  void revision; // dependent on event revision: re-render when sync/timeline changes
  return (
    <nav aria-label="Каналы">
      {listRooms(client)
        .filter((room) =>
          roomIds
            ? roomIds.includes(room.id)
            : !hideRoomIds?.includes(room.id) &&
              (room.encrypted || (showInvites && room.membership === 'invite')),
        )
        .filter((room) => showInvites || room.membership !== 'invite')
        .map((room) => (
          <div className="room-entry" key={room.id}>
            {room.membership === 'invite' ? (
              <button
                className="invite-button"
                onClick={async () => {
                  try {
                    await acceptRoomInvite(client, room.id);
                    onSelect(room.id);
                    setError('');
                  } catch {
                    setError('Не удалось принять приглашение.');
                  }
                }}
              >
                Принять приглашение: {room.name}
              </button>
            ) : (
              <button
                data-testid="room-link"
                data-room-id={room.id}
                className={room.id === selectedRoomId ? 'room-link selected' : 'room-link'}
                onClick={() => onSelect(room.id)}
              >
                <span>{isVoiceRoom(client, room.id) ? '🔊' : room.encrypted ? '🔒' : '⚠️'}</span>
                <span>{room.name}</span>
              </button>
            )}
          </div>
        ))}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </nav>
  );
}
