import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    minify: false,
    lib: {
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
      external: ['@desource/phone-mask', '@desource/phone-mask/kit', 'react', 'react-dom', 'react/jsx-runtime'],
      output: {
        exports: 'named',
        postBanner: (chunk) => (chunk.isEntry && chunk.name === 'index' ? "'use client';" : '')
      }
    }
  }
});
