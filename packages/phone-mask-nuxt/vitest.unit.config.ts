import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.{test,spec}.ts'],
    coverage: {
      include: ['src/**/*.{ts,js,mjs,cjs}'],
      exclude: ['src/**/*.d.ts']
    }
  }
});
