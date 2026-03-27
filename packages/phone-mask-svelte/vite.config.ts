import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      name: 'PhoneMaskSvelte',
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        core: fileURLToPath(new URL('./src/core.ts', import.meta.url))
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName = 'index') => {
        if (format === 'es') return `${entryName}.mjs`;
        return `${entryName}.cjs`;
      }
    },
    rolldownOptions: {
      external: ['@desource/phone-mask', 'svelte', /^svelte\//],
      output: {
        exports: 'named',
        globals: {
          '@desource/phone-mask': 'phoneMask',
          svelte: 'Svelte'
        },
        minify: true
      }
    }
  }
});
