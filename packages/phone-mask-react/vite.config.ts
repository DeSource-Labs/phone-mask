import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      name: 'PhoneMaskReact',
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
      external: ['@desource/phone-mask', 'react', 'react-dom', 'react/jsx-runtime'],
      output: {
        exports: 'named',
        globals: {
          '@desource/phone-mask': 'phoneMask',
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime'
        },
        minify: true
      }
    }
  }
});
