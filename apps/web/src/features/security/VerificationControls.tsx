import { useEffect, useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import { CryptoEvent } from 'matrix-js-sdk/lib/crypto-api';
import type { VerificationRequest } from 'matrix-js-sdk/lib/crypto-api';
import { VerificationFlow, requestOwnVerification } from '@xplink/matrix-adapter';

export function VerificationControls({ client }: { client: MatrixClient }) {
  const [flow, setFlow] = useState<VerificationFlow | null>(null);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState('');
  void revision;
  useEffect(() => {
    const onRequest = (request: VerificationRequest) => {
      setFlow((old) => {
        old?.dispose();
        return new VerificationFlow(request, () => setRevision((n) => n + 1));
      });
    };
    client.on(CryptoEvent.VerificationRequestReceived, onRequest);
    return () => {
      client.off(CryptoEvent.VerificationRequestReceived, onRequest);
    };
  }, [client]);
  const invoke = async (fn: () => Promise<unknown>) => {
    setNotice('');
    try {
      await fn();
      setRevision((n) => n + 1);
    } catch {
      setNotice('Не удалось завершить шаг проверки устройства.');
    }
  };
  const phase = flow?.state;
  const sas = flow?.sas;
  return (
    <section className="security-section">
      <h2>Подтверждение устройств</h2>
      <p>
        Сравните эмодзи или числа на обоих устройствах. Подтверждайте только при полном совпадении.
      </p>
      <button
        onClick={() =>
          void invoke(async () => {
            flow?.dispose();
            const request = await requestOwnVerification(client);
            setFlow(new VerificationFlow(request, () => setRevision((n) => n + 1)));
          })
        }
      >
        Запросить проверку своего устройства
      </button>
      {flow && (
        <div className="security-section">
          <strong>
            {flow.request.otherUserId} · {flow.request.otherDeviceId ?? 'все устройства'}
          </strong>
          <small>Этап проверки: {phase}</small>
          {phase === 2 && !flow.request.initiatedByMe && (
            <button onClick={() => void invoke(() => flow.accept())}>Принять запрос</button>
          )}
          {phase === 3 && (
            <button onClick={() => void invoke(() => flow.startSas())}>Сравнить коды SAS</button>
          )}
          {sas && (
            <div>
              <p>Сравните значения на двух экранах:</p>
              {sas.emoji.length > 0 && <div className="sas-display">{sas.emoji.join(' ')}</div>}
              {sas.decimal.length > 0 && (
                <div className="sas-display">{sas.decimal.join(' · ')}</div>
              )}
              <button onClick={() => void invoke(() => flow.confirm())}>Код совпадает</button>
              <button className="danger-button" onClick={() => flow.mismatch()}>
                Код НЕ совпадает
              </button>
            </div>
          )}
          {phase === 6 && <p role="status">Подтверждение завершено.</p>}
          {phase === 5 && <p role="alert">Проверка отменена.</p>}
          {phase !== 5 && phase !== 6 && (
            <button className="neutral-button" onClick={() => void invoke(() => flow.cancel())}>
              Отменить
            </button>
          )}
        </div>
      )}
      {notice && <p role="alert">{notice}</p>}
    </section>
  );
}
