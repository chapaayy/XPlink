import { expect, test } from '@playwright/test';

test('MatrixRTC authorizes three participants in an E2EE voice channel', async ({
  browser,
  request,
}) => {
  test.setTimeout(180_000);
  const password = process.env.XPLINK_TEST_PASSWORD;
  if (!password) throw new Error('CI RTC credentials missing');
  const contexts = await Promise.all(
    Array.from({ length: 3 }, () => browser.newContext({ permissions: ['microphone', 'camera'] })),
  );
  const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));
  const [alice, bob, carol] = pages;
  try {
    for (const [page, user] of [
      [alice, 'alicertc'],
      [bob, 'bobrtc'],
      [carol, 'carolrtc'],
    ] as const) {
      await page.goto('/');
      await page.getByLabel('Логин Matrix').fill(user);
      await page.getByLabel('Пароль').fill(password);
      await page.getByRole('button', { name: 'Войти' }).click();
      await expect(page.getByText('Зашифрованные каналы')).toBeVisible();
    }
    await alice.getByRole('button', { name: '＋ Голосовой канал' }).click();
    await alice.getByLabel('Название голосового канала').fill('RTC three-person test');
    await alice.getByLabel('Matrix ID в голосовой канал').fill('@bobrtc:localhost');
    await alice.getByRole('button', { name: 'Создать голосовой канал' }).click();
    await expect(bob.getByRole('button', { name: /Принять приглашение/ })).toBeVisible({
      timeout: 25_000,
    });

    const roomId = await alice
      .locator('[data-testid="room-link"]')
      .last()
      .getAttribute('data-room-id');
    if (!roomId) throw new Error('RTC room missing');
    const token = await alice.evaluate(() => {
      const session = JSON.parse(sessionStorage.getItem('xplink.matrix.session.v1') ?? '{}') as {
        accessToken?: string;
      };
      return session.accessToken;
    });
    if (!token) throw new Error('Matrix access token missing');
    const invite = await request.post(
      '/_matrix/client/v3/rooms/' + encodeURIComponent(roomId) + '/invite',
      {
        headers: { Authorization: 'Bearer ' + token },
        data: { user_id: '@carolrtc:localhost' },
      },
    );
    expect(invite.ok()).toBeTruthy();
    await bob.getByRole('button', { name: /Принять приглашение/ }).click();
    await expect(carol.getByRole('button', { name: /Принять приглашение/ })).toBeVisible({
      timeout: 25_000,
    });
    await carol.getByRole('button', { name: /Принять приглашение/ }).click();

    const transport = await request.get(
      '/_matrix/client/unstable/org.matrix.msc4143/rtc/transports',
      { headers: { Authorization: 'Bearer ' + token } },
    );
    expect(transport.ok()).toBeTruthy();
    const data = (await transport.json()) as { rtc_transports?: Array<{ type: string }> };
    expect(data.rtc_transports?.some((entry) => entry.type === 'livekit')).toBe(true);

    const noAuth = await request.get(
      '/_matrix/client/unstable/io.element.msc4195/rtc/livekit/sfu/get',
    );
    expect(noAuth.ok()).toBe(false);

    // A call must pass E2EE authorization before the component can start media.
    await alice.getByRole('button', { name: 'Начать голосовой звонок' }).click();
    await expect(alice.getByRole('dialog', { name: 'Защищённый звонок' })).toBeVisible();
    await expect(alice.getByText('Звонок заблокирован: MatrixRTC недоступен')).toHaveCount(0);
    await bob.getByRole('button', { name: 'Начать голосовой звонок' }).click();
    await carol.getByRole('button', { name: 'Начать голосовой звонок' }).click();
    await expect(bob.getByRole('dialog', { name: 'Защищённый звонок' })).toBeVisible();
    await expect(carol.getByRole('dialog', { name: 'Защищённый звонок' })).toBeVisible();
    await alice.getByRole('button', { name: 'Покинуть звонок' }).click();
    await expect(alice.getByRole('dialog', { name: 'Защищённый звонок' })).toHaveCount(0);
  } finally {
    await Promise.allSettled(contexts.map((ctx) => ctx.close()));
  }
});
