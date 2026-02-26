import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@common': fileURLToPath(new URL('../../common', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/*.{test,spec}.{ts,tsx}']
  }
});
