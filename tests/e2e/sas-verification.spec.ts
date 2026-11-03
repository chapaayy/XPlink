import { expect, test } from '@playwright/test';

test('two independent devices compare SAS before marking peer identity verified', async ({
  browser,
}) => {
  test.setTimeout(100_000);
  const password = process.env.XPLINK_TEST_PASSWORD;
  if (!password) throw new Error('Test credentials are not configured.');

  const a = await browser.newContext();
  const b = await browser.newContext();
  const alice = await a.newPage();
  const bob = await b.newPage();
  try {
    for (const [page, name] of [
      [alice, 'alicesas'],
      [bob, 'bobsas'],
    ] as const) {
      await page.goto('/');
      await expect(page.getByLabel('Логин Matrix')).toBeVisible();
      await page.getByLabel('Логин Matrix').fill(name);
      await page.getByLabel('Пароль').fill(password);
      await page.getByRole('button', { name: 'Войти' }).click();
      await expect(page.getByText('Зашифрованные каналы')).toBeVisible();
    }

    await alice.getByLabel('Новый E2EE-канал').fill('SAS test channel');
    await alice.getByLabel('Matrix ID участника').fill('@bobsas:localhost');
    await alice.getByRole('button', { name: 'Создать защищённый канал' }).click();
    await expect(bob.getByRole('button', { name: /Принять приглашение/ })).toBeVisible();
    await bob.getByRole('button', { name: /Принять приглашение/ }).click();
    await expect(bob.getByRole('textbox', { name: 'Сообщение' })).toBeVisible();

    await alice.getByRole('button', { name: 'Безопасность и устройства' }).click();
    await bob.getByRole('button', { name: 'Безопасность и устройства' }).click();
    await expect(alice.getByRole('button', { name: 'Проверить личность' })).toBeVisible({
      timeout: 20_000,
    });
    await alice.getByRole('button', { name: 'Проверить личность' }).click();
    await expect(bob.getByRole('button', { name: 'Принять запрос' })).toBeVisible({
      timeout: 25_000,
    });
    await bob.getByRole('button', { name: 'Принять запрос' }).click();
    await expect(alice.getByRole('button', { name: 'Сравнить коды SAS' })).toBeVisible();
    await alice.getByRole('button', { name: 'Сравнить коды SAS' }).click();

    const aSas = alice.locator('.sas-display').first();
    const bSas = bob.locator('.sas-display').first();
    await expect(aSas).toBeVisible({ timeout: 30_000 });
    await expect(bSas).toBeVisible({ timeout: 30_000 });
    const aCode = await aSas.textContent();
    const bCode = await bSas.textContent();
    expect(aCode).toBeTruthy();
    expect(aCode).toBe(bCode);

    // Both users must confirm in their own clients; nothing is auto-verified.
    await alice.getByRole('button', { name: 'Код совпадает' }).click();
    await bob.getByRole('button', { name: 'Код совпадает' }).click();
    await expect(alice.getByText('Подтверждение завершено.')).toBeVisible({ timeout: 25_000 });
    await expect(bob.getByText('Подтверждение завершено.')).toBeVisible({ timeout: 25_000 });
  } finally {
    await Promise.allSettled([a.close(), b.close()]);
  }
});
