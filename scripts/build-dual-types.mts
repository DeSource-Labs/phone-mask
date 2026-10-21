import { isAbsolute } from 'node:path';
import { build } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';

await build(
  ['ts', 'cts'].map((extension) => ({
    input: Object.fromEntries(process.argv.slice(2).map((entry) => [entry, `dist/types/${entry}.d.ts`])),
    external: (id: string) => !id.startsWith('.') && !isAbsolute(id),
    plugins: [dts({ dtsInput: true, sourcemap: false })],
    output: {
      dir: 'dist',
      format: 'es' as const,
      entryFileNames: `[name].d.${extension}`,
      chunkFileNames: `[name]-[hash].d.${extension}`,
      minifyInternalExports: false
    }
  }))
);
