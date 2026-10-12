import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import terser from '@rollup/plugin-terser';
import packageJson from './package.json' with { type: 'json' };

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
    chunkFileNames: 'chunks/[name]-[hash].js'
  };

  const cjsOutput = {
    format: 'cjs' as const,
    dir: fileURLToPath(new URL('./dist', import.meta.url)),
    entryFileNames: isKitBuild ? 'kit.cjs' : `${safeName}.cjs`,
    exports: 'named' as const
  };

  const umdName = isKitBuild ? 'kit' : safeName;
  const umdOutput = {
    format: 'umd' as const,
    name: isKitBuild ? `${camelName}Kit` : camelName,
    dir: fileURLToPath(new URL('./dist', import.meta.url)),
    entryFileNames: `${umdName}.umd.js`
  };

  return {
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: shouldEmptyOutDir,
      sourcemap: false,
      minify: false,
      target: 'es2020',
      lib: {
        entry: fileURLToPath(new URL(entryFile, import.meta.url)),
        name: camelName,
        fileName: () => `${entryName}.js`
      },

      rolldownOptions: {
        external: [],
        plugins: [],

        output: [
          esmOutput,
          cjsOutput,
          umdOutput,
          {
            ...umdOutput,
            entryFileNames: `${umdName}.umd.min.js`,
            minify: false,
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
