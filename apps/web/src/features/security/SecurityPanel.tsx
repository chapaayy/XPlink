import { useState } from 'react';
import type { MatrixClient } from 'matrix-js-sdk';
import type { VerificationRequest } from 'matrix-js-sdk/lib/crypto-api';
import type { SecretStorageAccess } from '@xplink/matrix-adapter';
import { RecoveryControls } from './RecoveryControls';
import { DeviceControls } from './DeviceControls';
import { VerificationControls } from './VerificationControls';
import { RoomTrust } from './RoomTrust';

interface Props {
  client: MatrixClient;
  secretAccess: SecretStorageAccess;
  roomId: string | null;
  revision: number;
}

export function SecurityPanel({ client, secretAccess, roomId, revision }: Props) {
  const [outgoingRequest, setOutgoingRequest] = useState<VerificationRequest | null>(null);
  return (
    <>
      <header>
        <h2>Безопасность XPlink</h2>
        <p className="muted">Этап 2 · Matrix Rust Crypto</p>
      </header>
      <RecoveryControls client={client} secretAccess={secretAccess} />
      <DeviceControls client={client} />
      <VerificationControls client={client} outgoingRequest={outgoingRequest} />
      <RoomTrust
        client={client}
        roomId={roomId}
        revision={revision}
        onVerificationRequested={setOutgoingRequest}
      />
    </>
  );
}
