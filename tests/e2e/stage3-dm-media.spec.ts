import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('private DM encrypts text, reactions and media; recipient decrypts attachment', async ({
  browser, request,
}) => {
  test.setTimeout(120_000);
  const password = process.env.XPLINK_TEST_PASSWORD;
  if (!password) throw new Error('CI account credentials missing');
  const a = await browser.newContext({ acceptDownloads: true });
  const b = await browser.newContext({ acceptDownloads: true });
  const alice = await a.newPage();
  const bob = await b.newPage();
  try {
    for (const [page, username] of [[alice,'alicedm'],[bob,'bobdm']] as const) {
      await page.goto('/');
      await page.getByLabel('Логин Matrix').fill(username);
      await page.getByLabel('Пароль').fill(password);
      await page.getByRole('button', { name: 'Войти' }).click();
      await expect(page.getByText('Зашифрованные каналы')).toBeVisible();
    }
    await alice.getByLabel('Matrix ID для личного сообщения').fill('@bobdm:localhost');
    await alice.getByRole('button', { name: 'Начать личный чат' }).click();
    await expect(bob.getByRole('button', { name: /Принять приглашение/ })).toBeVisible();
    await bob.getByRole('button', { name: /Принять приглашение/ }).click();
    await expect(alice.getByRole('textbox', { name: 'Сообщение' })).toBeVisible();

    const secret = 'PRIVATE-CHAT-' + Date.now();
    await alice.getByRole('textbox', { name: 'Сообщение' }).fill(secret);
    await alice.getByRole('button', { name: 'Отправить' }).click();
    await expect(bob.getByText(secret)).toBeVisible({ timeout: 40_000 });
    const message = alice.locator('.message').filter({ hasText: secret });
    await message.getByRole('button', { name: 'Реакция 👍' }).click();
    await expect(bob.locator('.message').filter({ hasText: secret })
      .locator('.reaction')).toContainText('👍 1', { timeout: 30_000 });

    const secretFile = 'NO-PLAINTEXT-MEDIA-' + Date.now();
    const fileName = 'secret-stage3.txt';
    let mediaUploadEncrypted = false;
    alice.on('request', (req) => {
      if (req.method() !== 'POST' || !req.url().includes('/upload')) return;
      const bytes = req.postDataBuffer();
      if (bytes) mediaUploadEncrypted = !bytes.includes(Buffer.from(secretFile));
    });
    await alice.getByLabel('Зашифрованное вложение').setInputFiles({
      name: fileName, mimeType: 'text/plain', buffer: Buffer.from(secretFile),
    });
    await expect(bob.getByText(fileName)).toBeVisible({ timeout: 40_000 });
    expect(mediaUploadEncrypted, 'media upload must not contain plaintext').toBe(true);
    const download = bob.waitForEvent('download');
    await bob.getByRole('button', { name: 'Скачать ' + fileName }).click();
    const item = await download;
    const data = await readFile(await item.path());
    expect(data.toString('utf8')).toBe(secretFile);

    const roomId = await alice.getByTestId('dm-link').getAttribute('data-room-id');
    // A DM may be listed without an explicit data attr; fall back to the room link.
    const login = await alice.evaluate(() => {
      const raw = sessionStorage.getItem('xplink.matrix.session.v1');
      return raw ? (JSON.parse(raw) as {accessToken:string}).accessToken : null;
    });
    expect(login).toBeTruthy();
    if (roomId) {
      const result = await request.get(
        '/_matrix/client/v3/rooms/' + encodeURIComponent(roomId) + '/messages?dir=b&limit=30',
        { headers: { Authorization: 'Bearer ' + login } },
      );
      expect(result.ok()).toBeTruthy();
      const wire = JSON.stringify(await result.json());
      expect(wire).not.toContain(secret);
      expect(wire).not.toContain(secretFile);
    }
  } finally {
    await Promise.allSettled([a.close(), b.close()]);
  }
});
