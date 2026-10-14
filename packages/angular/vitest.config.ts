import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import angular from '@analogjs/vite-plugin-angular';

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
    maxWorkers: 3,
    globals: true,
    setupFiles: ['tests/unit/setup/environment.ts'],
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts']
    }
  }
});
