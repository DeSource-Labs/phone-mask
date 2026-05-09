import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const tsconfig = fileURLToPath(new URL('./tsconfig.spec.json', import.meta.url));

export default defineConfig({
  plugins: [angular({ tsconfig })],
  resolve: {
    alias: {
      '@common': fileURLToPath(new URL('../../common', import.meta.url)),
      '@src': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    setupFiles: ['tests/unit/setup/angular.ts'],
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
    globals: true,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts']
    }
  }
});
