import { useEffect, useState } from 'react';
import { ClientEvent, MatrixEventEvent, RoomEvent } from 'matrix-js-sdk';
import type { MatrixClient } from 'matrix-js-sdk';
import { acquireCryptoTab, initializeMatrix } from '@xplink/matrix-adapter';
import type { StoredSession } from '@xplink/matrix-adapter';

export type SyncStatus = 'connecting' | 'syncing' | 'ready' | 'blocked' | 'error';

/** Runtime is intentionally owned by exactly one mounted App, not every feature. */
export function useMatrix(session: StoredSession | null) {
  const [client, setClient] = useState<MatrixClient | null>(null);
  const [status, setStatus] = useState<SyncStatus>('connecting');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    let activeClient: MatrixClient | undefined;
    let releaseTab: (() => void) | null = null;
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
        activeClient = await initializeMatrix(session);
        if (cancelled) {
          activeClient.stopClient();
          releaseTab();
          return;
        }
        activeClient.on(ClientEvent.Sync, sync);
        activeClient.on(RoomEvent.Timeline, (event) => {
          event.on(MatrixEventEvent.Decrypted, update);
          update();
        });
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
      activeClient?.stopClient();
      releaseTab?.();
    };
  }, [session]);

  return { client, status, error, revision };
}
