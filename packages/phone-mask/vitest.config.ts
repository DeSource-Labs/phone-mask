import { defineConfig } from 'vitest/config';

export default defineConfig({
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
