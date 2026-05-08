import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import terser from '@rollup/plugin-terser';
import packageJson from './package.json';

const rawName = packageJson.name.replace(/^@.*\//, '');
const safeName = rawName.replaceAll(/[^a-z0-9-_]/gi, '');
const camelName = safeName.replaceAll(/-([a-z0-9])/g, (_, ch: string) => ch.toUpperCase());

export default defineConfig(({ mode }) => {
  const isKitBuild = mode === 'kit';
  const entryName = isKitBuild ? 'kit' : 'index';
  const entryFile = isKitBuild ? './src/kit.ts' : './src/index.ts';
  const shouldEmptyOutDir = mode !== 'root';

  const esmOutput = {
    format: 'es' as const,
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
  };

  const cjsOutput = {
    format: 'cjs' as const,
    dir: fileURLToPath(new URL('./dist', import.meta.url)),
    entryFileNames: isKitBuild ? 'kit.cjs' : `${safeName}.cjs`,
    exports: 'named' as const,
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
  };

  return {
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: shouldEmptyOutDir,
      sourcemap: false,
      target: 'es2020',
      lib: {
        entry: fileURLToPath(new URL(entryFile, import.meta.url)),
        name: camelName,
        fileName: () => `${entryName}.js`
      },

      rolldownOptions: {
        external: [],
        plugins: [],

        output: isKitBuild
          ? [esmOutput, cjsOutput]
          : [
              esmOutput,
              cjsOutput,
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

    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    }
  };
});
