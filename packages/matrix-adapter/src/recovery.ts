import type { MatrixClient } from 'matrix-js-sdk';
import type { SecretStorageAccess } from './secret-storage';

function cryptoFor(client: MatrixClient) {
  const crypto = client.getCrypto();
  if (!crypto) throw new Error('Rust Crypto ещё не инициализирован.');
  return crypto;
}

export interface RecoveryStatus {
  secretStorage: boolean;
  crossSigning: boolean;
  keyBackup: boolean;
}

/** Never infer recovery readiness from the mere presence of an account. */
export async function getRecoveryStatus(client: MatrixClient): Promise<RecoveryStatus> {
  const crypto = cryptoFor(client);
  const [secretStorage, crossSigning, backup] = await Promise.all([
    crypto.isSecretStorageReady(),
    crypto.isCrossSigningReady(),
    crypto.checkKeyBackupAndEnable(),
  ]);
  return { secretStorage, crossSigning, keyBackup: backup !== null };
}

/** Initial setup, exactly once per account; never silently resets existing keys. */
export async function createRecovery(
  client: MatrixClient,
  access: SecretStorageAccess,
  accountPassword: string,
): Promise<string> {
  const crypto = cryptoFor(client);
  if (await crypto.isSecretStorageReady() || await crypto.userHasCrossSigningKeys()) {
    throw new Error('Ключи уже существуют. Используйте восстановление, а не сброс.');
  }
  const userId = client.getUserId();
  if (!userId || !accountPassword) throw new Error('Необходим пароль текущей учётной записи.');
  const generated = await crypto.createRecoveryKeyFromPassphrase();
  if (!generated.encodedPrivateKey) throw new Error('SDK не вернул ключ восстановления.');
  try {
    access.setRawKey(generated.privateKey);
    await crypto.bootstrapSecretStorage({
      createSecretStorageKey: async () => generated,
      setupNewKeyBackup: true,
    });
    await crypto.bootstrapCrossSigning({
      authUploadDeviceSigningKeys: async (makeRequest) =>
        makeRequest({
          type: 'm.login.password',
          identifier: { type: 'm.id.user', user: userId },
          password: accountPassword,
        }),
    });
    await crypto.checkKeyBackupAndEnable();
    return generated.encodedPrivateKey;
  } finally {
    generated.privateKey.fill(0);
    // Leave the private key in memory only until explicit lock or logout,
    // to permit the SDK to finish queued secret storage operations.
  }
}

/** Restores trust keys and old Megolm sessions on an existing new device. */
export async function recoverDevice(
  client: MatrixClient,
  access: SecretStorageAccess,
  encodedRecoveryKey: string,
): Promise<{ imported: number; total: number }> {
  const crypto = cryptoFor(client);
  if (!(await crypto.isSecretStorageReady())) {
    throw new Error('У аккаунта пока нет хранилища восстановления.');
  }
  access.unlock(encodedRecoveryKey);
  try {
    await crypto.bootstrapCrossSigning({
      // An existing cross-signing identity is restored, not silently replaced.
      authUploadDeviceSigningKeys: async () => {
        throw new Error('Создание новой identity запрещено при восстановлении.');
      },
    });
    await crypto.loadSessionBackupPrivateKeyFromSecretStorage();
    const result = await crypto.restoreKeyBackup();
    return { imported: result.imported, total: result.total };
  } catch {
    access.clear();
    throw new Error('Не удалось восстановить ключи. Проверьте recovery key и резервную копию.');
  }
}
