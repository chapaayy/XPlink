import { expect, test } from '@playwright/test';

test('a second tab cannot open the same Rust Crypto store concurrently', async ({ browser }) => {
  const password = process.env.XPLINK_TEST_PASSWORD;
  if (!password) throw new Error('Test credentials are missing');
  const context = await browser.newContext();
  const first = await context.newPage();
  try {
    await first.goto('/');
    await first.getByLabel('Логин Matrix').fill('alicetab');
    await first.getByLabel('Пароль').fill(password);
    await first.getByRole('button', { name: 'Войти' }).click();
    await expect(first.getByText('Зашифрованные каналы')).toBeVisible();

    const stored = await first.evaluate(() => sessionStorage.getItem('xplink.matrix.session.v1'));
    expect(stored).toBeTruthy();
    const other = await context.newPage();
    await other.goto('/');
    await other.evaluate((session) => {
      sessionStorage.setItem('xplink.matrix.session.v1', session);
    }, stored!);
    await other.reload();
    await expect(other.getByText(/Откройте XPlink только в одной вкладке/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(first.getByText('Зашифрованные каналы')).toBeVisible();
  } finally {
    await context.close();
  }
});
