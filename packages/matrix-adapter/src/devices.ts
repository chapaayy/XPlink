import type { MatrixClient } from 'matrix-js-sdk';

export interface OwnDevice {
  deviceId: string;
  displayName: string;
  lastSeen: number | null;
  current: boolean;
  verified: boolean;
}

/** Uses actual Matrix /devices and Rust Crypto trust state, not client-side guesses. */
export async function listOwnDevices(client: MatrixClient): Promise<OwnDevice[]> {
  const crypto = client.getCrypto();
  if (!crypto) throw new Error('Rust Crypto недоступен.');
  const userId = client.getUserId();
  if (!userId) throw new Error('Нет Matrix user ID.');
  const { devices } = await client.getDevices();
  return Promise.all(
    devices.map(async (device) => {
      const trust = await crypto.getDeviceVerificationStatus(userId, device.device_id);
      return {
        deviceId: device.device_id,
        displayName: device.display_name ?? 'Без названия',
        lastSeen: device.last_seen_ts ?? null,
        current: device.device_id === client.getDeviceId(),
        verified: trust?.isVerified() ?? false,
      };
    }),
  );
}

/** Other-device session revocation is enforced by the homeserver with password UIA. */
export async function revokeDevice(
  client: MatrixClient,
  deviceId: string,
  password: string,
): Promise<void> {
  if (!deviceId || deviceId === client.getDeviceId()) {
    throw new Error('Текущее устройство отключайте через «Выйти».');
  }
  const userId = client.getUserId();
  if (!userId || !password) throw new Error('Для отзыва устройства требуется пароль.');
  await client.deleteDevice(deviceId, {
    type: 'm.login.password',
    identifier: { type: 'm.id.user', user: userId },
    password,
  });
}
