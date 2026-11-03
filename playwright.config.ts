import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  expect: { timeout: 35_000 },
  retries: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:8080', headless: true, browserName: 'chromium' },
});
