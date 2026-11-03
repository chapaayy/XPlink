import { expect, test } from '@playwright/test';

test('space categories link E2EE channels and Synapse enforces readonly/role permissions', async ({
  browser,
  request,
}) => {
  test.setTimeout(120_000);
  const password = process.env.XPLINK_TEST_PASSWORD;
  if (!password) throw new Error('CI account credentials missing');
  const a = await browser.newContext();
  const b = await browser.newContext();
  const alice = await a.newPage();
  const bob = await b.newPage();
  try {
    for (const [page, username] of [
      [alice, 'alicework'],
      [bob, 'bobwork'],
    ] as const) {
      await page.goto('/');
      await page.getByLabel('Логин Matrix').fill(username);
      await page.getByLabel('Пароль').fill(password);
      await page.getByRole('button', { name: 'Войти' }).click();
      await expect(page.getByText('Зашифрованные каналы')).toBeVisible();
    }

    await alice.getByRole('button', { name: 'Создать пространство' }).click();
    await alice.getByLabel('Название пространства').fill('Studio');
    await alice.getByRole('button', { name: 'Создать', exact: true }).click();
    await expect(alice.getByText('Пространство · Studio')).toBeVisible({ timeout: 30_000 });

    await alice.getByLabel('Тип элемента').selectOption('category');
    await alice.locator('#space-new-name').fill('Design');
    await alice.getByRole('button', { name: 'Создать', exact: true }).click();
    try {
      await expect(alice.getByText('⌄ Design')).toBeVisible({ timeout: 20_000 });
    } catch (error) {
      // Only generic UI status is inspected, never messages, keys or credentials.
      console.error('Category creation status:', await alice.getByRole('alert').allTextContents());
      throw error;
    }

    await alice.getByLabel('Тип элемента').selectOption('channel');
    await alice.getByLabel('Категория канала').selectOption({ label: 'Design' });
    await alice.locator('#space-new-name').fill('concepts');
    await alice.getByLabel('Пригласить в канал').fill('@bobwork:localhost');
    await alice.getByRole('button', { name: 'Создать', exact: true }).click();
    await expect(bob.getByRole('button', { name: /Принять приглашение/ })).toBeVisible({
      timeout: 30_000,
    });
    await bob.getByRole('button', { name: /Принять приглашение/ }).click();
    await expect(bob.getByRole('textbox', { name: 'Сообщение' })).toBeVisible();

    await expect(alice.getByRole('button', { name: 'Участники и права' })).toBeVisible();
    await alice.getByRole('button', { name: 'Участники и права' }).click();
    await alice.getByLabel('Только модераторы могут писать').check();
    await expect(alice.getByRole('status').getByText(/Настройки применены/)).toBeVisible();
    await expect(bob.getByRole('button', { name: 'Отправить' })).toBeDisabled();

    const roomId = await alice
      .locator('[data-testid="room-link"]')
      .last()
      .getAttribute('data-room-id');
    if (!roomId) throw new Error('Channel ID was not observed');
    const bobToken = await bob.evaluate(() => {
      const raw = sessionStorage.getItem('xplink.matrix.session.v1');
      return raw ? (JSON.parse(raw) as { accessToken: string }).accessToken : null;
    });
    if (!bobToken) throw new Error('No session');
    // Try an actual Matrix client endpoint: server must refuse, not just the UI.
    const power = await request.get(
      '/_matrix/client/v3/rooms/' + encodeURIComponent(roomId) + '/state/m.room.power_levels',
      { headers: { Authorization: 'Bearer ' + bobToken } },
    );
    expect(power.ok()).toBeTruthy();
    const unauthorized = await request.put(
      '/_matrix/client/v3/rooms/' + encodeURIComponent(roomId) + '/state/m.room.power_levels',
      { headers: { Authorization: 'Bearer ' + bobToken }, data: await power.json() },
    );
    expect(unauthorized.status()).toBe(403);

    const select = alice.getByLabel('Роль @bobwork:localhost');
    await expect(select).toBeVisible({ timeout: 20_000 });
    await select.selectOption('moderator');
    await expect(bob.getByRole('button', { name: 'Отправить' })).toBeEnabled({ timeout: 30_000 });
    const message = 'MODERATOR-CAN-SEND-' + Date.now();
    await bob.getByRole('textbox', { name: 'Сообщение' }).fill(message);
    await bob.getByRole('button', { name: 'Отправить' }).click();
    await expect(alice.getByText(message)).toBeVisible({ timeout: 30_000 });
  } finally {
    await Promise.allSettled([a.close(), b.close()]);
  }
});
