import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/e2e/**/*.{test,spec}.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    sequence: {
      concurrent: false
    }
  }
});
