import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import type { ElementCallHandle } from '@element-hq/element-call-component/api';
import { UserIntent } from '@element-hq/element-call-component/api';
import { authorizeRtcCall } from '@xplink/rtc-adapter';
import type { CallTarget } from '@xplink/rtc-adapter';
import '@element-hq/element-call-component/style.css';
// The heavyweight upstream RTC implementation is loaded only while calling.
const ElementCall = lazy(() =>
  import('@element-hq/element-call-component').then((component) => ({
    default: component.ElementCall,
  })),
);
let initialized: Promise<void> | null = null;
async function initialize(): Promise<void> {
  initialized ??= import('@element-hq/element-call-component').then((module) =>
    module.initializeElementCall({
      // No analytics, crash reporting, or external telemetry.
      media_devices: { enable_audio: false, enable_video: false },
    }),
  );
  await initialized;
}
function callIntent(target: CallTarget): UserIntent {
  if (target.direct) {
    if (target.kind === 'voice') {
      return target.intent === 'start'
        ? UserIntent.StartNewCallDMVoice
        : UserIntent.JoinExistingCallDMVoice;
    }
    return target.intent === 'start' ? UserIntent.StartNewCallDM : UserIntent.JoinExistingCallDM;
  }
  if (target.kind === 'voice') {
    return target.intent === 'start'
      ? UserIntent.StartNewCallVoice
      : UserIntent.JoinExistingCallVoice;
  }
  return target.intent === 'start' ? UserIntent.StartNewCall : UserIntent.JoinExistingCall;
}
interface Props {
  client: MatrixClient;
  target: CallTarget;
  onClose: () => void;
  onError: (message: string) => void;
}
export function CallOverlay({ client, target, onClose, onError }: Props) {
  const [ready, setReady] = useState(false);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const handle = useRef<ElementCallHandle>(null);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);
  onCloseRef.current = onClose;
  onErrorRef.current = onError;
  const intent = useMemo(() => callIntent(target), [target]);
  useEffect(() => {
    let alive = true;
    void Promise.all([authorizeRtcCall(client, target), initialize()])
      .then(() => {
        if (alive) setReady(true);
      })
      .catch(() => {
        if (alive) {
          onErrorRef.current('Звонок заблокирован: MatrixRTC недоступен или E2EE комнаты не подтверждено.');
          onCloseRef.current();
        }
      });
    return () => {
      alive = false;
    };
  }, [client, target]);
  const finish = async () => {
    if (busy) return;
    setBusy(true);
    if (joined) {
      try {
        await handle.current?.hangUp();
      } catch {
        /* Upstream may already have disconnected; closing releases UI. */
      }
    }
    onClose();
  };
  return (
    <section
      className="call-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Защищённый звонок"
    >
      <header className="call-overlay-header">
        <div>
          <strong>{target.kind === 'voice' ? 'Голосовой звонок' : 'Видеозвонок'}</strong>
          <small>{joined ? 'В звонке · E2EE' : 'Подключение к защищённому звонку'}</small>
        </div>
        <button
          type="button"
          onClick={() => void finish()}
          disabled={busy}
          aria-label="Завершить звонок"
        >
          ✕
        </button>
      </header>
      {ready ? (
        <Suspense fallback={<p className="call-loader">Загрузка защищённого звонка…</p>}>
          <ElementCall
            client={client}
            roomId={target.roomId}
            intent={intent}
            theme="dark"
            language="ru"
            ref={handle}
            config={{ confineToRoom: true, hideScreensharing: false }}
            hostBridge={{
              notifyJoined: async () => setJoined(true),
              notifyHungUp: async () => {
                setJoined(false);
                onClose();
              },
              close: async () => onClose(),
            }}
          />
        </Suspense>
      ) : (
        <p className="call-loader" role="status">
          Проверка E2EE, доступа к комнате и LiveKit…
        </p>
      )}
      <footer className="call-overlay-footer">
        <span>Звук, видео, микрофон, выбор устройств и экран управляются в Element Call.</span>
        <button type="button" onClick={() => void finish()} disabled={busy}>
          Покинуть звонок
        </button>
      </footer>
    </section>
  );
}
