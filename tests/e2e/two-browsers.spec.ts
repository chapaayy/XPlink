import { test, expect } from '@playwright/test';

test('two independent browsers exchange E2EE ciphertext; Synapse does not see text', async ({
  browser,
  request,
}) => {
  const password = process.env.XPLINK_TEST_PASSWORD;
  if (!password) throw new Error('XPLINK_TEST_PASSWORD must be set by the test runner');
  const a = await browser.newContext();
  const b = await browser.newContext();
  try {
    const alice = await a.newPage();
    const bob = await b.newPage();
    for (const [page, name] of [
      [alice, 'alice'],
      [bob, 'bob'],
    ] as const) {
      await page.goto('/');
      await page.getByLabel('Логин Matrix').fill(name);
      await page.getByLabel('Пароль').fill(password);
      await page.getByRole('button', { name: 'Войти' }).click();
      await expect(page.getByText('Зашифрованные каналы')).toBeVisible();
    }
    const channel = `Stage1-${Date.now()}`;
    await alice.getByLabel('Новый E2EE-канал').fill(channel);
    await alice.getByLabel('Matrix ID участника').fill('@bob:localhost');
    await alice.getByRole('button', { name: 'Создать защищённый канал' }).click();
    await expect(bob.getByRole('button', { name: /Принять приглашение/ })).toBeVisible();
    await bob.getByRole('button', { name: /Принять приглашение/ }).click();
    await expect(bob.getByRole('textbox', { name: 'Сообщение' })).toBeVisible();
    await expect(alice.getByRole('textbox', { name: 'Сообщение' })).toBeVisible();
    const secretMessage = `E2EE-PROOF-${Date.now()}-NOT-ON-SERVER`;
    await alice.getByRole('textbox', { name: 'Сообщение' }).fill(secretMessage);
    await alice.getByRole('button', { name: 'Отправить' }).click();
    await expect(bob.getByText(secretMessage)).toBeVisible({ timeout: 90_000 });
    const roomId = await alice
      .locator('[data-testid="room-link"]')
      .first()
      .getAttribute('data-room-id');
    if (!roomId) throw new Error('Room ID not found');
    const accessToken = await alice.evaluate(() => {
      const item = sessionStorage.getItem('xplink.matrix.session.v1');
      return item ? (JSON.parse(item) as { accessToken: string }).accessToken : null;
    });
    const response = await request.get(
      `/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/messages?dir=b&limit=30`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    expect(response.ok()).toBeTruthy();
    const json = (await response.json()) as { chunk: { type: string }[] };
    expect(json.chunk.some((ev) => ev.type === 'm.room.encrypted')).toBe(true);
    expect(JSON.stringify(json)).not.toContain(secretMessage);
  } finally {
    await a.close();
    await b.close();
  }
});
