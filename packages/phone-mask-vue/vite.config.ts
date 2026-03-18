import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      name: 'PhoneMaskVue',
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es', 'cjs', 'iife'],
      fileName: (format) => {
        switch (format) {
          case 'es':
            return 'index.mjs';
          case 'cjs':
            return 'index.cjs';
          case 'iife':
            return 'index.js';
          default:
            return 'index.js';
        }
      }
    },
    rolldownOptions: {
      external: ['@desource/phone-mask', 'vue'],
      output: {
        exports: 'named',
        globals: {
          '@desource/phone-mask': 'phoneMask',
          vue: 'Vue'
        },
        minify: true
      }
    }
  }
});
