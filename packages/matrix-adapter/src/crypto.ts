import type { MatrixClient } from 'matrix-js-sdk';

/** Never fall back to a plaintext message, even if room state is incomplete. */
export async function assertEncryptedRoom(client: MatrixClient, roomId: string): Promise<void> {
  const room = client.getRoom(roomId);
  if (!room || room.getMyMembership() !== 'join') {
    throw new Error('Нет доступа к комнате.');
  }
  const crypto = client.getCrypto();
  if (
    !crypto ||
    !room.hasEncryptionStateEvent() ||
    !(await crypto.isEncryptionEnabledInRoom(roomId))
  ) {
    throw new Error('Отправка заблокирована: E2EE ещё не подтверждено.');
  }
}
