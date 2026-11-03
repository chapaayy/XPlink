import { useEffect, useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import { roomIdentities, requestPeerVerification, removeRoomMember } from '@xplink/matrix-adapter';
import type { PeerIdentity } from '@xplink/matrix-adapter';

interface Props {
  client: MatrixClient;
  roomId: string | null;
  revision: number;
}

export function RoomTrust({ client, roomId, revision }: Props) {
  const [peers, setPeers] = useState<PeerIdentity[]>([]);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!roomId) {
      setPeers([]);
      return;
    }
    let active = true;
    void roomIdentities(client, roomId)
      .then((next) => {
        if (active) setPeers(next);
      })
      .catch(() => {
        if (active) setNotice('Не удалось получить статус участников.');
      });
    return () => {
      active = false;
    };
  }, [client, roomId, revision]);
  if (!roomId) return null;
  return (
    <section className="security-section">
      <h2>Участники и доверие</h2>
      <p>
        Непроверенные могут получать сообщения. Изменённая identity блокирует отправку до проверки.
      </p>
      {peers.map((peer) => (
        <div className="device-item" key={peer.userId}>
          <strong>{peer.userId}</strong>
          <small>
            {peer.changed
              ? '⚠️ Identity изменилась'
              : peer.verified
                ? '✓ Проверено'
                : 'Не проверено'}
          </small>
          {peer.changed && (
            <p className="trust-warning">
              Не отправляйте сообщения, пока личность не подтверждена!
            </p>
          )}
          <button
            onClick={() =>
              void requestPeerVerification(client, peer.userId, roomId)
                .then(() => setNotice('Запрос проверки отправлен.'))
                .catch(() => setNotice('Не удалось запросить проверку.'))
            }
          >
            Проверить личность
          </button>
          <button
            className="danger-button"
            onClick={() => {
              if (
                !window.confirm('Исключить участника? Ранее полученное содержимое отозвать нельзя.')
              )
                return;
              void removeRoomMember(client, roomId, peer.userId)
                .then(() => setNotice('Участник исключён. Отправляющая Megolm-сессия сброшена.'))
                .catch(() => setNotice('Сервер запретил исключение или ключи не обновились.'));
            }}
          >
            Исключить из комнаты
          </button>
        </div>
      ))}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
