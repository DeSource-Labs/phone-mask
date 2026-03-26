import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      name: 'PhoneMaskVue',
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        core: fileURLToPath(new URL('./src/core.ts', import.meta.url)),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const basename = entryName ?? 'index';
        if (format === 'es') return `${basename}.mjs`;
        return `${basename}.cjs`;
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
