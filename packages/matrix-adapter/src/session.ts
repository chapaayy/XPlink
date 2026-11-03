import { createClient } from 'matrix-js-sdk';

const STORAGE_KEY = 'xplink.matrix.session.v1';

export interface StoredSession {
  readonly accessToken: string;
  readonly userId: string;
  readonly deviceId: string;
  readonly baseUrl: string;
}

/** Session lifetime is deliberately limited to this browser session in stage 1. */
export function readSession(): StoredSession | null {
  try {
    const raw: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!raw || typeof raw !== 'object') return null;
    const s = raw as Record<string, unknown>;
    if (
      typeof s.accessToken !== 'string' ||
      !s.accessToken ||
      typeof s.deviceId !== 'string' ||
      !s.deviceId ||
      typeof s.userId !== 'string' ||
      !s.userId ||
      typeof s.baseUrl !== 'string' ||
      !s.baseUrl
    )
      return null;
    return {
      accessToken: s.accessToken,
      deviceId: s.deviceId,
      userId: s.userId,
      baseUrl: s.baseUrl,
    };
  } catch {
    return null;
  }
}

export function storeSession(session: StoredSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Auth-only client: no crypto store is opened before a real device ID exists. */
export async function passwordLogin(
  baseUrl: string,
  user: string,
  password: string,
): Promise<StoredSession> {
  const authClient = createClient({ baseUrl });
  const result = await authClient.loginRequest({
    type: 'm.login.password',
    identifier: { type: 'm.id.user', user },
    password,
    initial_device_display_name: 'XPlink Web (Stage 1)',
  });
  if (!result.access_token || !result.user_id || !result.device_id) {
    throw new Error('Сервер не вернул необходимые данные устройства.');
  }
  return {
    accessToken: result.access_token,
    userId: result.user_id,
    deviceId: result.device_id,
    baseUrl,
  };
}
