import { test, expect } from '@playwright/test';

/** The private recovery key is never printed in CI logs or test attachments. */
test('second device restores backed-up E2EE history and revokes the first session', async ({
  browser,
  request,
}) => {
  test.setTimeout(150_000);
  const password = process.env.XPLINK_TEST_PASSWORD;
  if (!password) throw new Error('Test credentials missing');
  const firstCtx = await browser.newContext();
  const secondCtx = await browser.newContext();
  const first = await firstCtx.newPage();
  const second = await secondCtx.newPage();
  try {
    await first.goto('/');
    await first.getByLabel('Логин Matrix').fill('carol');
    await first.getByLabel('Пароль').fill(password);
    await first.getByRole('button', { name: 'Войти' }).click();
    await expect(first.getByText('Зашифрованные каналы')).toBeVisible();

    await first.getByRole('button', { name: 'Безопасность и устройства' }).click();
    await first.getByLabel('Пароль аккаунта для первичной настройки').fill(password);
    await first.getByRole('button', { name: 'Создать recovery key' }).click();
    const keyNode = first.getByTestId('generated-recovery-key');
    await expect(keyNode).toBeVisible({ timeout: 30_000 });
    const recoveryKey = (await keyNode.textContent())?.trim();
    if (!recoveryKey) throw new Error('Recovery key missing');
    await first.getByRole('button', { name: 'Я сохранил ключ' }).click();

    const roomName = 'Recovery-' + Date.now();
    await first.getByLabel('Новый E2EE-канал').fill(roomName);
    await first.getByRole('button', { name: 'Создать защищённый канал' }).click();
    const message = 'RECOVER-HISTORY-' + Date.now();
    await first.getByRole('textbox', { name: 'Сообщение' }).fill(message);
    await first.getByRole('button', { name: 'Отправить' }).click();
    await expect(first.getByText(message)).toBeVisible();

    const auth = await first.evaluate(() => {
      const session = JSON.parse(sessionStorage.getItem('xplink.matrix.session.v1') ?? '{}') as {
        accessToken?: string;
        deviceId?: string;
      };
      return session;
    });
    expect(auth.accessToken).toBeTruthy();
    const backupUrl = '/_matrix/client/v3/room_keys/version';
    await expect
      .poll(
        async () => {
          const response = await request.get(backupUrl, {
            headers: { Authorization: 'Bearer ' + auth.accessToken },
          });
          if (!response.ok()) return 0;
          const data = (await response.json()) as { count?: number };
          return data.count ?? 0;
        },
        { timeout: 60_000 },
      )
      .toBeGreaterThan(0);

    await second.goto('/');
    await second.getByLabel('Логин Matrix').fill('carol');
    await second.getByLabel('Пароль').fill(password);
    await second.getByRole('button', { name: 'Войти' }).click();
    await expect(second.getByText('Зашифрованные каналы')).toBeVisible();
    await second.getByRole('button', { name: 'Безопасность и устройства' }).click();
    await second.getByLabel('Recovery key для нового устройства').fill(recoveryKey);
    await second.getByRole('button', { name: 'Восстановить историю и доверие' }).click();
    await expect(second.getByRole('status').getByText(/Восстановлено ключей/)).toBeVisible({
      timeout: 45_000,
    });

    // Reload replays history using the restored local Megolm keys.
    await second.reload();
    await expect(second.getByText('Зашифрованные каналы')).toBeVisible();
    await second.getByRole('button', { name: new RegExp(roomName) }).click();
    await expect(second.getByText(message)).toBeVisible({ timeout: 40_000 });

    await second.getByRole('button', { name: 'Безопасность и устройства' }).click();
    await second.getByLabel('Пароль для отзыва устройства').fill(password);
    // The Synapse registration account may own additional devices.
    // Revoke the exact original browser device instead of assuming only two exist.
    const previous = second.locator('.device-item').filter({ hasText: auth.deviceId });
    await expect(previous).toBeVisible();
    second.once('dialog', (dialog) => void dialog.accept());
    await previous.getByRole('button', { name: 'Отозвать сессию' }).click();
    await expect(previous).toHaveCount(0);

    await expect.poll(async () => {
      const whoami = await request.get('/_matrix/client/v3/account/whoami', {
        headers: { Authorization: 'Bearer ' + auth.accessToken },
      });
      return whoami.status();
    }, { timeout: 15_000 }).toBe(401);
  } finally {
    await Promise.allSettled([firstCtx.close(), secondCtx.close()]);
  }
});
