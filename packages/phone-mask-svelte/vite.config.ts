import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      name: 'lib',
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        style: fileURLToPath(new URL('./src/style.scss', import.meta.url))
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (entryName === 'style') return `style.js`;
        switch (format) {
          case 'es':
            return 'index.mjs';
          default:
            return 'index.cjs';
        }
      }
    },
    minify: false,
    rollupOptions: {
      external: ['svelte', /^svelte\//],
      output: {
        exports: 'named',
        globals: {
          svelte: 'Svelte'
        }
      }
    }
  }
});
