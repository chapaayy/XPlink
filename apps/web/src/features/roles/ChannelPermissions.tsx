import { useEffect, useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import {
  assignChannelRole,
  isRoomCreator,
  setChannelReadOnly,
  isReadOnly,
  userLevel,
} from '@xplink/matrix-adapter';
import type { ChannelRole } from '@xplink/matrix-adapter';

interface Props {
  client: MatrixClient;
  roomId: string;
  revision: number;
}

export function ChannelPermissions({ client, roomId, revision }: Props) {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [invitee, setInvitee] = useState('');
  const [requestedReadOnly, setRequestedReadOnly] = useState<boolean | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, ChannelRole>>({});
  void revision;
  const room = client.getRoom(roomId);
  const members = room?.getJoinedMembers() ?? [];
  const serverReadOnly = isReadOnly(client, roomId);
  const readOnly = requestedReadOnly ?? serverReadOnly;
  // Keep the user's choice visible while waiting for the authoritative room-state echo.
  useEffect(() => {
    if (requestedReadOnly !== null && requestedReadOnly === serverReadOnly)
      setRequestedReadOnly(null);
  }, [requestedReadOnly, serverReadOnly, roomId]);
  useEffect(() => {
    setPendingRoles((current) => {
      let changed = false;
      const next = { ...current };
      for (const [userId, choice] of Object.entries(current)) {
        const level = userLevel(client, roomId, userId);
        const actual: ChannelRole = level >= 100 ? 'admin' : level >= 50 ? 'moderator' : 'member';
        if (actual === choice) {
          delete next[userId];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [client, roomId, revision]);
  const changeReadOnly = async (value: boolean) => {
    setRequestedReadOnly(value);
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await setChannelReadOnly(client, roomId, value);
      setNotice('Настройки применены сервером Matrix.');
    } catch {
      setRequestedReadOnly(null);
      setError('Сервер отказал в изменении режима канала.');
    } finally {
      setBusy(false);
    }
  };
  const changeRole = async (userId: string, value: ChannelRole) => {
    setPendingRoles((current) => ({ ...current, [userId]: value }));
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await assignChannelRole(client, roomId, userId, value);
      setNotice('Настройки применены сервером Matrix.');
    } catch {
      setPendingRoles((current) => {
        const next = { ...current };
        delete next[userId];
        return next;
      });
      setError('Сервер отказал в изменении роли.');
    } finally {
      setBusy(false);
    }
  };
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      setNotice('Настройки применены сервером Matrix.');
    } catch {
      setError('Сервер отказал в изменении прав или участников.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <aside className="permissions-panel" aria-label="Участники и права">
      <h2>Участники и роли</h2>
      <p className="muted">Права хранятся в Matrix power levels и проверяются Synapse.</p>
      <label className="permission-toggle">
        <input
          type="checkbox"
          checked={readOnly}
          disabled={busy}
          onChange={(event) => void changeReadOnly(event.target.checked)}
        />
        Только модераторы могут писать
      </label>
      <form
        className="compact-form"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            await client.invite(roomId, invitee);
            setInvitee('');
          });
        }}
      >
        <label htmlFor="channel-invite-member">Пригласить участника</label>
        <input
          id="channel-invite-member"
          value={invitee}
          onChange={(e) => setInvitee(e.target.value)}
          placeholder="@user:localhost"
          required
        />
        <button disabled={busy} type="submit">
          Пригласить
        </button>
      </form>
      <div className="permission-members">
        {members.map((member) => {
          const level = userLevel(client, roomId, member.userId);
          const creator = isRoomCreator(client, roomId, member.userId);
          const role: ChannelRole = level >= 100 ? 'admin' : level >= 50 ? 'moderator' : 'member';
          return (
            <div key={member.userId} className="permission-member">
              <strong>{member.userId}{creator ? ' · Создатель' : ''}</strong>
              <select
                aria-label={'Роль ' + member.userId}
                value={pendingRoles[member.userId] ?? role}
                disabled={busy || creator}
                onChange={(event) =>
                  void changeRole(member.userId, event.target.value as ChannelRole)
                }
              >
                <option value="member">Участник</option>
                <option value="moderator">Модератор</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
          );
        })}
      </div>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
    </aside>
  );
}
