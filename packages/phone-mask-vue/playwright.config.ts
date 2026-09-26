import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:5173'
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    gracefulShutdown: { signal: 'SIGINT', timeout: 5_000 },
    reuseExistingServer: !process.env.CI
  }
});
