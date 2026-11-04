import { useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import {
  assertEncryptedRoom,
  childRoomIds,
  directRoomIds,
  listRooms,
  listSpaces,
} from '@xplink/matrix-adapter';
import type { SecretStorageAccess } from '@xplink/matrix-adapter';
import { RoomList } from '../features/channels/RoomList';
import { CreateRoomForm } from '../features/channels/CreateRoomForm';
import { WorkspaceRail } from '../features/spaces/WorkspaceRail';
import { SpaceNavigation } from '../features/spaces/SpaceNavigation';
import { DirectChats } from '../features/directs/DirectChats';
import { ChannelPermissions } from '../features/roles/ChannelPermissions';
import { MessageTimeline } from '../features/messages/MessageTimeline';
import { Composer } from '../features/messages/Composer';
import { CallOverlay } from '../features/calls/CallOverlay';
import { CreateVoiceRoomForm } from '../features/calls/CreateVoiceRoomForm';
import type { CallTarget } from '@xplink/rtc-adapter';
import { directRoomIds as listDirectRooms } from '@xplink/matrix-adapter';
import { SecurityPanel } from '../features/security/SecurityPanel';

interface Props {
  secretAccess: SecretStorageAccess;
  client: MatrixClient;
  revision: number;
  userId: string;
  onLogout: () => Promise<void>;
}

export function AppShell({ client, revision, userId, onLogout, secretAccess }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<'security' | 'roles' | null>(null);
  const [securityState, setSecurityState] = useState('');
  const [activeCall, setActiveCall] = useState<CallTarget | null>(null);
  const [callError, setCallError] = useState('');
  const rooms = listRooms(client);
  const active = rooms.find((room) => room.id === selected && room.membership === 'join');
  const encrypted = Boolean(active?.encrypted);
  const spaces = listSpaces(client);
  const nested = spaces.flatMap((space) => childRoomIds(client, space.id));
  const direct = [...directRoomIds(client)];
  const callInRoom = (kind: 'voice' | 'video', intent: 'start' | 'join' = 'start') => {
    if (!active || !active.encrypted) return;
    setCallError('');
    setActiveCall({
      roomId: active.id,
      kind,
      intent,
      direct: listDirectRooms(client).has(active.id),
    });
  };
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
      <WorkspaceRail
        client={client}
        activeSpace={selectedSpace}
        revision={revision}
        onSelect={(id) => {
          setSelectedSpace(id);
          setSelected(null);
        }}
      />
      <aside className="sidebar">
        <header className="sidebar-header">
          <div>
            <h1>XPlink</h1>
            <small>Зашифрованные каналы</small>
          </div>
          <span className="online-dot" title="Подключено" />
        </header>
        <div className="sidebar-scroll">
          {selectedSpace ? (
            <SpaceNavigation
              client={client}
              spaceId={selectedSpace}
              selectedRoomId={selected}
              onSelect={(id) => void selectRoom(id)}
              revision={revision}
            />
          ) : (
            <>
              <p className="section-label">Каналы</p>
              <RoomList
                client={client}
                selectedRoomId={selected}
                onSelect={(id) => void selectRoom(id)}
                revision={revision}
                hideRoomIds={[...nested, ...direct]}
              />
              <CreateRoomForm client={client} onCreated={(id) => void selectRoom(id)} />
              <CreateVoiceRoomForm client={client} onCreated={(id) => void selectRoom(id)} />
              <DirectChats
                client={client}
                selectedRoomId={selected}
                onSelect={(id) => void selectRoom(id)}
                revision={revision}
              />
            </>
          )}
        </div>
        <button
          className="security-toggle"
          onClick={() => setRightPanel((value) => (value === 'security' ? null : 'security'))}
          aria-expanded={rightPanel === 'security'}
        >
          🔐 Безопасность и устройства
        </button>
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
              <div className="call-header-controls">
                <button
                  onClick={() => callInRoom('voice')}
                  disabled={!encrypted}
                  aria-label="Начать голосовой звонок"
                >
                  ☎ Голос
                </button>
                <button
                  onClick={() => callInRoom('video')}
                  disabled={!encrypted}
                  aria-label="Начать видеозвонок"
                >
                  ▣ Видео
                </button>
              </div>
              <button
                className="chat-permissions"
                disabled={!encrypted}
                onClick={() => setRightPanel((value) => (value === 'roles' ? null : 'roles'))}
              >
                Участники и права
              </button>
            </header>
            {callError && (
              <div className="security-alert" role="alert">
                {callError}
              </div>
            )}
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
                Комната не зашифрована. Отправка и просмотр заблокированы.
              </div>
            )}
          </>
        ) : (
          <div className="empty-chat">
            <div className="empty-icon">🔐</div>
            <h2>Защищённая переписка начинается здесь</h2>
            <p>
              Создайте E2EE-канал, пространство или личный чат. Содержимое сообщений доступно только
              устройствам с ключами.
            </p>
            <p className="muted">
              Сохраните recovery key. Для публичного запуска требуется аудит безопасности.
            </p>
          </div>
        )}
      </main>
      {activeCall && (
        <CallOverlay
          key={activeCall.roomId + activeCall.kind}
          client={client}
          target={activeCall}
          onError={(message) => setCallError(message)}
          onClose={() => setActiveCall(null)}
        />
      )}
      {rightPanel === 'security' && (
        <aside className="security-panel" aria-label="Безопасность">
          <SecurityPanel
            client={client}
            secretAccess={secretAccess}
            roomId={active?.id ?? null}
            revision={revision}
          />
        </aside>
      )}
      {rightPanel === 'roles' && encrypted && active && (
        <ChannelPermissions client={client} roomId={active.id} revision={revision} />
      )}
    </div>
  );
}
