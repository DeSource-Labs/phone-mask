import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        style: resolve(__dirname, 'src/style.scss')
      },
      name: 'PhoneMaskReact',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (entryName === 'style') {
          return 'style.css';
        }
        if (format === 'es') return 'esm/index.js';
        return 'phone-mask-react.cjs.js';
      }
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime'
        }
      }
    },
    sourcemap: true,
    emptyOutDir: true
  }
});
