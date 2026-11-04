import { useEffect, useRef, useState } from 'react';
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
import { NotificationSettings } from '../features/notifications/NotificationSettings';
import { usePrivateNotifications } from '../features/notifications/usePrivateNotifications';
import { InstallControls } from '../features/pwa/InstallControls';

interface Props {
  secretAccess: SecretStorageAccess;
  client: MatrixClient;
  revision: number;
  userId: string;
  onLogout: () => Promise<void>;
}

export function AppShell({ client, revision, userId, onLogout, secretAccess }: Props) {
  usePrivateNotifications(client);
  const [selected, setSelected] = useState<string | null>(null);
  const chatHeading = useRef<HTMLElement>(null);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<'security' | 'roles' | null>(null);
  const [securityState, setSecurityState] = useState('');
  const [activeCall, setActiveCall] = useState<CallTarget | null>(null);
  const [callError, setCallError] = useState('');
  const rooms = listRooms(client);
  const active = rooms.find((room) => room.id === selected && room.membership === 'join');
  const encrypted = Boolean(active?.encrypted);
  useEffect(() => { if (active?.id) chatHeading.current?.focus(); }, [active?.id]);
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRightPanel(null);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);
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
    setRightPanel(null);
    try {
      await assertEncryptedRoom(client, id);
      setSecurityState('');
    } catch {
      setSecurityState('Внимание: у комнаты не подтверждено E2EE. Отправка заблокирована.');
    }
  };
  return (
    <div className="app-layout" data-mobile-pane={active ? 'chat' : 'channels'}>
      <a className="skip-link" href={active ? '#main-content' : '#channel-navigation'}>Перейти к содержимому</a>
      <WorkspaceRail
        client={client}
        activeSpace={selectedSpace}
        revision={revision}
        onSelect={(id) => {
          setSelectedSpace(id);
          setSelected(null);
        }}
      />
      <aside className="sidebar" id="channel-navigation" aria-label="Список каналов">
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
      <main className="chat-area" id="main-content" tabIndex={-1}>
        {active ? (
          <>
            <header className="chat-header">
              <button type="button" className="mobile-back" aria-label="Назад к каналам" onClick={() => { setSelected(null); setRightPanel(null); }}>← Каналы</button>
              <div>
                <strong ref={chatHeading} tabIndex={-1}># {active.name}</strong>
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
          <button type="button" className="panel-close" onClick={() => setRightPanel(null)} aria-label="Закрыть панель">✕ Закрыть</button>
          <SecurityPanel
            client={client}
            secretAccess={secretAccess}
            roomId={active?.id ?? null}
            revision={revision}
          />
          <NotificationSettings />
          <InstallControls />
        </aside>
      )}
      {rightPanel === 'roles' && encrypted && active && (
        <aside className="roles-panel-wrapper" aria-label="Участники и права">
          <button type="button" className="panel-close" onClick={() => setRightPanel(null)} aria-label="Закрыть панель">✕ Закрыть</button>
          <ChannelPermissions client={client} roomId={active.id} revision={revision} />
        </aside>
      )}
    </div>
  );
}
