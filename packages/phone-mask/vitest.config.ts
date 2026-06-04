import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@common': fileURLToPath(new URL('../../common', import.meta.url)),
      '@src': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.{test,spec}.ts'],
    coverage: {
      include: ['src/**/*.{ts,tsx,js,mjs,cjs}'],
      exclude: ['src/**/*.d.ts']
    }
  }
});
