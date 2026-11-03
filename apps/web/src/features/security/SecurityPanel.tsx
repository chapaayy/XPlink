import type { MatrixClient } from 'matrix-js-sdk';
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
  return (
    <>
      <header>
        <h2>Безопасность XPlink</h2>
        <p className="muted">Этап 2 · Matrix Rust Crypto</p>
      </header>
      <RecoveryControls client={client} secretAccess={secretAccess} />
      <DeviceControls client={client} />
      <VerificationControls client={client} />
      <RoomTrust client={client} roomId={roomId} revision={revision} />
    </>
  );
}
