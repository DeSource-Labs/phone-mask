import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      name: 'PhoneMaskReact',
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'es') return 'index.mjs';
        return 'index.cjs';
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
