import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PhoneMaskReact',
      formats: ['es', 'cjs'],
      fileName: (format) => {
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
        },
        assetFileNames: 'style.[ext]'
      }
    },
    sourcemap: true,
    emptyOutDir: true
  }
});
