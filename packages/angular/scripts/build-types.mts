import { globSync, rmSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { build } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';

const previousDeclarations = globSync('dist/**/*.d.ts');
const result = await build({
  // These declarations are already compiled; avoid unrelated workspace tsconfig discovery.
  tsconfig: false,
  input: { index: 'dist/index.d.ts', 'core/index': 'dist/core/index.d.ts' },
  external: (id) => !id.startsWith('.') && !isAbsolute(id),
  plugins: [dts({ dtsInput: true, sourcemap: false })],
  output: {
    dir: 'dist',
    format: 'es',
    entryFileNames: '[name].d.ts',
    chunkFileNames: '[name]-[hash].d.ts',
    minifyInternalExports: false
  }
});

const emitted = new Set(result.output.map(({ fileName }) => join('dist', fileName)));
for (const file of previousDeclarations) {
  if (!emitted.has(file)) rmSync(file);
}
