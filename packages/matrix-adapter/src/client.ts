import { createClient } from 'matrix-js-sdk';
import type { MatrixClient } from 'matrix-js-sdk';
import type { StoredSession } from './session';
import type { SecretStorageAccess } from './secret-storage';

/** The only place in the app that constructs an authenticated crypto-enabled Matrix client. */
export async function initializeMatrix(session: StoredSession, access?: SecretStorageAccess): Promise<MatrixClient> {
  const client = createClient({
    baseUrl: session.baseUrl,
    accessToken: session.accessToken,
    userId: session.userId,
    deviceId: session.deviceId,
    disableVoip: true,
    cryptoCallbacks: access?.callbacks,
  });
  try {
    await client.initRustCrypto();
    if (!client.getCrypto()) throw new Error('Шифрование не запустилось.');
    return client;
  } catch (error) {
    client.stopClient();
    throw error;
  }
}
