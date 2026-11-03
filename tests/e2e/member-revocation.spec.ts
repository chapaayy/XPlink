import { expect, test } from '@playwright/test';

test('kicked user cannot fetch a new encrypted event', async ({ browser, request }) => {
  test.setTimeout(90_000);
  const password = process.env.XPLINK_TEST_PASSWORD;
  if (!password) throw new Error('Test credentials are missing');
  const a = await browser.newContext();
  const b = await browser.newContext();
  const alice = await a.newPage();
  const bob = await b.newPage();
  try {
    for (const [page, username] of [
      [alice, 'alicemember'],
      [bob, 'bobmember'],
    ] as const) {
      await page.goto('/');
      await page.getByLabel('Логин Matrix').fill(username);
      await page.getByLabel('Пароль').fill(password);
      await page.getByRole('button', { name: 'Войти' }).click();
      await expect(page.getByText('Зашифрованные каналы')).toBeVisible();
    }

    await alice.getByLabel('Новый E2EE-канал').fill('Membership test');
    await alice.getByLabel('Matrix ID участника').fill('@bobmember:localhost');
    await alice.getByRole('button', { name: 'Создать защищённый канал' }).click();
    await expect(bob.getByRole('button', { name: /Принять приглашение/ })).toBeVisible();
    await bob.getByRole('button', { name: /Принять приглашение/ }).click();
    await expect(bob.getByRole('textbox', { name: 'Сообщение' })).toBeVisible();

    const roomId = await alice
      .locator('[data-testid="room-link"]')
      .first()
      .getAttribute('data-room-id');
    if (!roomId) throw new Error('Room not created');
    const oldToken = await bob.evaluate(() => {
      const raw = sessionStorage.getItem('xplink.matrix.session.v1');
      return raw ? (JSON.parse(raw) as { accessToken: string }).accessToken : null;
    });
    const currentToken = await alice.evaluate(() => {
      const raw = sessionStorage.getItem('xplink.matrix.session.v1');
      return raw ? (JSON.parse(raw) as { accessToken: string }).accessToken : null;
    });
    if (!oldToken || !currentToken) throw new Error('Matrix sessions missing');

    await alice.getByRole('button', { name: 'Безопасность и устройства' }).click();
    await expect(alice.getByRole('button', { name: 'Исключить из комнаты' })).toBeVisible({
      timeout: 20_000,
    });
    alice.once('dialog', (dialog) => void dialog.accept());
    await alice.getByRole('button', { name: 'Исключить из комнаты' }).click();
    await expect(alice.getByRole('status').getByText(/Участник исключён/)).toBeVisible();

    const postKick = 'POST-KICK-E2EE-' + Date.now();
    await alice.getByRole('textbox', { name: 'Сообщение' }).fill(postKick);
    await alice.getByRole('button', { name: 'Отправить' }).click();
    await expect(alice.getByText(postKick)).toBeVisible();

    const roomPath = encodeURIComponent(roomId);
    const events = await request.get(
      '/_matrix/client/v3/rooms/' + roomPath + '/messages?dir=b&limit=20',
      { headers: { Authorization: 'Bearer ' + currentToken } },
    );
    expect(events.ok()).toBeTruthy();
    const body = (await events.json()) as {
      chunk: Array<{ event_id: string; type: string }>;
    };
    expect(JSON.stringify(body)).not.toContain(postKick);
    const encrypted = body.chunk.find((event) => event.type === 'm.room.encrypted');
    expect(encrypted).toBeDefined();
    if (!encrypted) return;

    const forbidden = await request.get(
      '/_matrix/client/v3/rooms/' + roomPath + '/event/' + encodeURIComponent(encrypted.event_id),
      { headers: { Authorization: 'Bearer ' + oldToken } },
    );
    // Synapse may return 404 to avoid revealing whether the event exists.
    expect([403, 404]).toContain(forbidden.status());
  } finally {
    await Promise.allSettled([a.close(), b.close()]);
  }
});
