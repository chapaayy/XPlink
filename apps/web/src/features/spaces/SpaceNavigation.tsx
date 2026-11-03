import { useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import { childRoomIds, createCategory, createSpaceChannel, inviteToSpace, listSpaces } from '@xplink/matrix-adapter';
import { RoomList } from '../channels/RoomList';

interface Props {
  client: MatrixClient;
  spaceId: string;
  selectedRoomId: string | null;
  onSelect: (id: string) => void;
  revision: number;
}

export function SpaceNavigation({ client, spaceId, selectedRoomId, onSelect, revision }: Props) {
  const [kind, setKind] = useState<'channel' | 'category'>('channel');
  const [parent, setParent] = useState('');
  const [name, setName] = useState('');
  const [invite, setInvite] = useState('');
  const [member, setMember] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  void revision;
  const allSpaces = listSpaces(client);
  const space = allSpaces.find((item) => item.id === spaceId);
  const directChildren = childRoomIds(client, spaceId);
  const categories = allSpaces.filter((item) => directChildren.includes(item.id));
  const channels = directChildren.filter((id) => !categories.some((category) => category.id === id));

  return <section aria-label="Каналы пространства" className="space-navigation">
    <p className="section-label">Пространство · {space?.name ?? 'Загрузка…'}</p>
    <RoomList client={client} selectedRoomId={selectedRoomId} onSelect={onSelect}
      revision={revision} roomIds={channels} showInvites={false} />
    {categories.map((category) => <div key={category.id}>
      <p className="category-label">⌄ {category.name}</p>
      <RoomList client={client} selectedRoomId={selectedRoomId} onSelect={onSelect}
        revision={revision} roomIds={childRoomIds(client, category.id)} showInvites={false} />
    </div>)}
    <form className="room-form" onSubmit={(event) => {
      event.preventDefault();
      setBusy(true); setError('');
      const action = kind === 'category' ? createCategory(client, spaceId, name) :
        createSpaceChannel(client, parent || spaceId, name, invite);
      void action.then((id) => {
        setName(''); setInvite('');
        if (kind === 'channel') onSelect(id);
      }).catch(() => setError('Создание не удалось. Проверьте права и Matrix ID.'))
        .finally(() => setBusy(false));
    }}>
      <label htmlFor="space-new-name">Добавить в пространство</label>
      <select aria-label="Тип элемента" value={kind}
        onChange={(event) => setKind(event.target.value as 'channel' | 'category')}>
        <option value="channel">Защищённый канал</option>
        <option value="category">Категория</option>
      </select>
      {kind === 'channel' && <select aria-label="Категория канала" value={parent}
        onChange={(event) => setParent(event.target.value)}>
        <option value="">Без категории</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>}
      <input id="space-new-name" placeholder={kind === 'channel' ? 'Название канала' : 'Название категории'}
        value={name} onChange={(event) => setName(event.target.value)} required />
      {kind === 'channel' && <input aria-label="Пригласить в канал" value={invite}
        onChange={(event) => setInvite(event.target.value)} placeholder="@user:localhost (необязательно)" />}
      <button disabled={busy || !name.trim()} type="submit">Создать</button>
      {error && <p role="alert">{error}</p>}
    </form>
    <form className="room-form" onSubmit={(event) => {
      event.preventDefault(); setBusy(true); setError('');
      void inviteToSpace(client, spaceId, member).then(() => setMember(''))
        .catch(() => setError('Не удалось пригласить участника в пространство.'))
        .finally(() => setBusy(false));
    }}>
      <label htmlFor="space-invite">Пригласить в пространство</label>
      <input id="space-invite" value={member} onChange={(event) => setMember(event.target.value)}
        placeholder="@user:localhost" required />
      <button disabled={busy} type="submit">Пригласить</button>
    </form>
  </section>;
}
