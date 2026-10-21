import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import angular from '@analogjs/vite-plugin-angular';

// These files rely on import-time Angular Testing Library cleanup or module mocks.
const isolatedTests = ['tests/unit/phone*.test.ts', 'tests/unit/use{Country,PhoneMask}.test.ts'];

export default defineConfig({
  oxc: false,
  plugins: [angular({ tsconfig: fileURLToPath(new URL('./tests/tsconfig.json', import.meta.url)) })],
  resolve: {
    alias: {
      '@common': fileURLToPath(new URL('../../common', import.meta.url)),
      '@src': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    pool: 'forks',
    isolate: false,
    maxWorkers: 3,
    globals: true,
    setupFiles: ['tests/unit/setup/environment.ts'],
    projects: [
      { extends: true, test: { name: 'shared', include: ['tests/unit/**/*.test.ts'], exclude: isolatedTests } },
      { extends: true, test: { name: 'isolated', isolate: true, include: isolatedTests } }
    ],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts']
    }
  }
});
