import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import dts from 'vite-plugin-dts';
import terser from '@rollup/plugin-terser';
import packageJson from './package.json';

const rawName = packageJson.name.replace(/^@.*\//, '');
const safeName = rawName.replaceAll(/[^a-z0-9-_]/gi, '');
const camelName = safeName.replaceAll(/-([a-z0-9])/g, (_, ch: string) => ch.toUpperCase());

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: camelName,
      fileName: () => `${safeName}.js`
    },

    // disable Vite/esbuild automatic minify so terser is used per-output
    minify: false,

    rolldownOptions: {
      external: [],
      plugins: [],

      output: [
        // ESM per-module output (safe for bundlers). Conservative terser per-module if desired.
        {
          format: 'es',
          dir: fileURLToPath(new URL('./dist/esm', import.meta.url)),
          preserveModules: true,
          preserveModulesRoot: fileURLToPath(new URL('./src', import.meta.url)),
          entryFileNames: '[name].js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          minify: false,
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
          dir: fileURLToPath(new URL('./dist', import.meta.url)),
          entryFileNames: `${safeName}.cjs`,
          exports: 'named',
          minify: true,
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
          dir: fileURLToPath(new URL('./dist', import.meta.url)),
          entryFileNames: `${safeName}.umd.min.js`,
          minify: true,
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
        propertyReadSideEffects: false
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
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  }
});
