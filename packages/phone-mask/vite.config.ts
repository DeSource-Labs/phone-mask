import path from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import terser from '@rollup/plugin-terser';
import packageJson from './package.json';

const rawName = packageJson.name.replace(/^@.*\//, '');
const safeName = rawName.replace(/[^a-z0-9-_]/gi, '');
const camelName = safeName.replace(/-([a-z0-9])/g, (_, ch: string) => ch.toUpperCase());

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: camelName,
      fileName: () => `${safeName}.js`
    },

    // disable Vite/esbuild automatic minify so terser is used per-output
    minify: false,

    rollupOptions: {
      external: [],

      // You may keep json also here if you want it applied at rollup bundling time,
      // but the top-level pre-enforced plugin ensures Vite's dev / transform phase sees JSON first.
      plugins: [
        // json(...) // optional duplicate if you prefer rollup-time handling; top-level plugin covers Vite transform time
      ],

      output: [
        // ESM per-module output (safe for bundlers). Conservative terser per-module if desired.
        {
          format: 'es',
          dir: path.resolve(__dirname, 'dist/esm'),
          preserveModules: true,
          preserveModulesRoot: path.resolve(__dirname, 'src'),
          entryFileNames: '[name].js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          compact: false,
          plugins: [
            terser({
              compress: { passes: 2 },
              mangle: { toplevel: false },
              keep_fnames: true,
              keep_classnames: true,
              format: { comments: false }
            })
          ]
        },
        // CJS single-file build for Node consumers. Conservative terser (no toplevel mangle)
        {
          format: 'cjs',
          dir: path.resolve(__dirname, 'dist'),
          entryFileNames: `${safeName}.cjs.js`,
          exports: 'named',
          compact: true,
          plugins: [
            terser({
              compress: { passes: 2 },
              mangle: { toplevel: false },
              keep_fnames: true,
              keep_classnames: true,
              format: { comments: false }
            })
          ]
        },
        // UMD single-file minified build for CDN (aggressive allowed)
        {
          format: 'umd',
          name: camelName,
          dir: path.resolve(__dirname, 'dist'),
          entryFileNames: `${safeName}.umd.min.js`,
          plugins: [
            terser({
              compress: {
                passes: 3,
                drop_console: true,
                drop_debugger: true
              },
              mangle: { toplevel: true },
              format: { comments: false }
            })
          ]
        }
      ],

      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },

    cssCodeSplit: false
  },

  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist/types'
    })
  ],

  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  }
});
