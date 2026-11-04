import { useEffect, useState } from 'react';
import { ClientEvent, MatrixEventEvent, RoomEvent } from 'matrix-js-sdk';
import type { MatrixClient } from 'matrix-js-sdk';
import { acquireCryptoTab, initializeMatrix } from '@xplink/matrix-adapter';
import type { StoredSession, SecretStorageAccess } from '@xplink/matrix-adapter';

export type SyncStatus = 'connecting' | 'syncing' | 'ready' | 'blocked' | 'error';

/** Runtime is intentionally owned by exactly one mounted App, not every feature. */
export function useMatrix(session: StoredSession | null, secretAccess: SecretStorageAccess) {
  const [client, setClient] = useState<MatrixClient | null>(null);
  const [status, setStatus] = useState<SyncStatus>('connecting');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    let activeClient: MatrixClient | undefined;
    let releaseTab: (() => void) | null = null;
    const pending = new Map<import('matrix-js-sdk').MatrixEvent, () => void>();
    const onTimeline = (event: import('matrix-js-sdk').MatrixEvent) => {
      if (event.getType() === 'm.room.encrypted' && !pending.has(event)) {
        const decrypted = () => {
          event.off(MatrixEventEvent.Decrypted, decrypted);
          pending.delete(event);
          update();
        };
        pending.set(event, decrypted);
        event.on(MatrixEventEvent.Decrypted, decrypted);
      }
      update();
    };
    const update = () => {
      if (!cancelled) setRevision((old) => old + 1);
    };
    const sync = (state: string) => {
      if (cancelled) return;
      setStatus(state === 'PREPARED' || state === 'SYNCING' ? 'ready' : 'syncing');
      update();
    };
    const initialize = async () => {
      try {
        releaseTab = await acquireCryptoTab();
        if (cancelled) {
          releaseTab?.();
          return;
        }
        if (!releaseTab) {
          setStatus('blocked');
          setError('Откройте XPlink только в одной вкладке. Web Locks недоступны или заняты.');
          return;
        }
        activeClient = await initializeMatrix(session, secretAccess);
        if (cancelled) {
          activeClient.stopClient();
          releaseTab();
          return;
        }
        activeClient.on(ClientEvent.Sync, sync);
        activeClient.on(RoomEvent.Timeline, onTimeline);
        setClient(activeClient);
        setStatus('syncing');
        await activeClient.startClient({ initialSyncLimit: 50 });
      } catch {
        if (!cancelled) {
          setError('Не удалось инициализировать Matrix или локальное криптохранилище.');
          setStatus('error');
        }
        activeClient?.stopClient();
        releaseTab?.();
      }
    };
    void initialize();
    return () => {
      cancelled = true;
      activeClient?.off(RoomEvent.Timeline, onTimeline);
      activeClient?.off(ClientEvent.Sync, sync);
      for (const [event, decrypted] of pending) event.off(MatrixEventEvent.Decrypted, decrypted);
      pending.clear();
      activeClient?.stopClient();
      releaseTab?.();
    };
  }, [session, secretAccess]);

  return { client, status, error, revision };
}
