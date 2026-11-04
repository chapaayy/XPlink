import { expect, test } from '@playwright/test';

test('installable manifest and offline fallback never cache private Matrix data', async ({
  browser,
  request,
}) => {
  const manifestResponse = await request.get('/manifest.webmanifest');
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = (await manifestResponse.json()) as {
    display: string;
    start_url: string;
    icons: Array<{ src: string; sizes: string }>;
  };
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('/');
  for (const size of ['192x192', '512x512']) {
    const asset = manifest.icons.find((icon) => icon.sizes === size);
    expect(asset, 'install icon must be present').toBeDefined();
    const iconResponse = await request.get(asset!.src);
    expect(iconResponse.ok()).toBeTruthy();
    expect(iconResponse.headers()['content-type']).toMatch(/image\/png/);
  }

  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto('/');
    // In development, registration is explicit: never let a caching worker
    // interfere with Vite HMR or testing of the Matrix crypto store.
    const keys = await page.evaluate(async () => {
      const worker = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      await worker.update();
      const response = await fetch('/_matrix/client/versions');
      if (!response.ok) throw new Error('Matrix gateway offline before test');
      const names = await caches.keys();
      const cached = await Promise.all(
        names.map(async (name) => ({
          name,
          urls: (await (await caches.open(name)).keys()).map((req) => new URL(req.url).pathname),
        })),
      );
      return cached;
    });
    expect(keys).toHaveLength(1);
    expect(keys[0].urls.sort()).toEqual(
      ['/icons/xplink-192.png', '/icons/xplink-512.png', '/offline.html'].sort(),
    );
    expect(JSON.stringify(keys)).not.toMatch(/_matrix|livekit|session|access_token|m\.room/);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'XPlink — нет соединения' })).toBeVisible();
    await expect(page.getByText('Переписка и ключи шифрования не кэшируются')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('mobile channel navigation, focus, keyboard dismissal and explicit notification consent', async ({
  browser,
}) => {
  const password = process.env.XPLINK_TEST_PASSWORD;
  if (!password) throw new Error('Stage 5 test account is not configured');
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ['notifications'],
    reducedMotion: 'reduce',
  });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await page.getByLabel('Логин Matrix').fill('aliceux');
    await page.getByLabel('Пароль').fill(password);
    await page.getByRole('button', { name: 'Войти' }).click();
    await expect(page.getByText('Зашифрованные каналы')).toBeVisible();
    await expect(page.locator('.app-layout')).toHaveAttribute('data-mobile-pane', 'channels');
    await page.getByLabel('Новый E2EE-канал').fill('UX mobile test');
    await page.getByRole('button', { name: 'Создать защищённый канал' }).click();
    await expect(page.locator('.app-layout')).toHaveAttribute('data-mobile-pane', 'chat');
    await expect(page.getByRole('textbox', { name: 'Сообщение' })).toBeVisible();
    await expect(page.locator('.chat-header strong')).toBeFocused();

    await page.getByRole('button', { name: 'Назад к каналам' }).click();
    await expect(page.locator('.app-layout')).toHaveAttribute('data-mobile-pane', 'channels');
    await expect(page.getByRole('button', { name: /UX mobile test/ })).toBeVisible();
    await page.getByRole('button', { name: 'Безопасность и устройства' }).click();
    await expect(page.getByRole('region', { name: 'Уведомления' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Включить уведомления' })).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem('xplink.private-notifications.v1')),
    ).toBeNull();

    await page.getByRole('button', { name: 'Включить уведомления' }).click();
    await expect(page.getByRole('button', { name: 'Выключить уведомления' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('xplink.private-notifications.v1'))).toBe(
      '1',
    );
    await page.getByRole('button', { name: 'Выключить уведомления' }).click();
    expect(
      await page.evaluate(() => localStorage.getItem('xplink.private-notifications.v1')),
    ).toBeNull();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('region', { name: 'Уведомления' })).toHaveCount(0);
    await expect(page.locator('.app-layout')).toHaveAttribute('data-mobile-pane', 'channels');
  } finally {
    await context.close();
  }
});
