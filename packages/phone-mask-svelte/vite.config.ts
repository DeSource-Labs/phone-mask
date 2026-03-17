import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      name: 'lib',
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url))
      },
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'es') return 'index.mjs';
        return 'index.cjs';
      }
    },
    minify: false,
    rolldownOptions: {
      external: ['@desource/phone-mask', 'svelte', /^svelte\//],
      output: {
        exports: 'named',
        globals: {
          '@desource/phone-mask': 'PhoneMask',
          svelte: 'Svelte'
        },
        minify: true
      }
    }
  }
});
