import { useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import { assertEncryptedRoom, listRooms } from '@xplink/matrix-adapter';
import { RoomList } from '../features/channels/RoomList';
import { CreateRoomForm } from '../features/channels/CreateRoomForm';
import { MessageTimeline } from '../features/messages/MessageTimeline';
import { Composer } from '../features/messages/Composer';

interface Props {
  client: MatrixClient;
  revision: number;
  userId: string;
  onLogout: () => Promise<void>;
}

export function AppShell({ client, revision, userId, onLogout }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [securityState, setSecurityState] = useState('');
  const rooms = listRooms(client);
  const active = rooms.find((r) => r.id === selected && r.membership === 'join');
  const encrypted = Boolean(active?.encrypted);
  const selectRoom = async (id: string) => {
    setSelected(id);
    try {
      await assertEncryptedRoom(client, id);
      setSecurityState('');
    } catch {
      setSecurityState('Внимание: у комнаты не подтверждено E2EE. Отправка заблокирована.');
    }
  };
  return (
    <div className="app-layout">
      <aside className="workspace-rail" aria-label="Пространства">
        <div className="brand-logo compact">XP</div>
        <div className="rail-divider" />
        <div className="rail-pill">#</div>
      </aside>
      <aside className="sidebar">
        <header className="sidebar-header">
          <div>
            <h1>XPlink</h1>
            <small>Зашифрованные каналы</small>
          </div>
          <span className="online-dot" title="Подключено" />
        </header>
        <div className="sidebar-scroll">
          <p className="section-label">Каналы · этап 1</p>
          <RoomList
            client={client}
            selectedRoomId={selected}
            onSelect={(id) => void selectRoom(id)}
            revision={revision}
          />
          <CreateRoomForm client={client} onCreated={(id) => void selectRoom(id)} />
        </div>
        <footer className="sidebar-footer">
          <div className="user-avatar">{userId.at(1)?.toUpperCase() ?? '?'}</div>
          <div className="user-info">
            <strong>{userId.split(':')[0]}</strong>
            <small>Сессия устройства</small>
          </div>
          <button onClick={() => void onLogout()} title="Выйти">
            Выйти
          </button>
        </footer>
      </aside>
      <main className="chat-area">
        {active ? (
          <>
            <header className="chat-header">
              <div>
                <strong># {active.name}</strong>
                <small>🔒 E2EE Matrix / Rust Crypto</small>
              </div>
              <span className="header-note">Только тестовый этап</span>
            </header>
            {securityState && (
              <div className="security-alert" role="alert">
                {securityState}
              </div>
            )}
            {encrypted ? (
              <>
                <MessageTimeline client={client} roomId={active.id} revision={revision} />
                <Composer key={active.id} client={client} roomId={active.id} />
              </>
            ) : (
              <div className="center-notice">
                Эта комната не зашифрована. Просмотр и отправка заблокированы.
              </div>
            )}
          </>
        ) : (
          <div className="empty-chat">
            <div className="empty-icon">🔐</div>
            <h2>Защищённая переписка начинается здесь</h2>
            <p>
              Создайте зашифрованный канал и пригласите второго участника по Matrix ID. У второго
              пользователя появится приглашение.
            </p>
            <p className="muted">
              До этапа 2 не используйте для критически важных данных: подтверждение устройств и
              recovery ещё недоступны.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
