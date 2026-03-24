import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      name: 'PhoneMaskVue',
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'es') return 'index.mjs';
        return 'index.cjs';
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
        minify: true,
        topLevelVar: false
      }
    }
  }
});
