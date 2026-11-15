import { isAbsolute, resolve } from 'node:path';
import { build } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';

await build(
  ['ts', 'cts'].map((extension) => ({
    input: Object.fromEntries(process.argv.slice(2).map((entry) => [entry, resolve(`dist/types/${entry}.d.ts`)])),
    external: (id: string) => !id.startsWith('.') && !isAbsolute(id),
    plugins: [dts({ dtsOnly: true, sourcemap: false })],
    output: {
      dir: 'dist',
      format: 'es' as const,
      entryFileNames: `[name].d.${extension}`,
      chunkFileNames: `[name]-[hash].d.${extension}`,
      minifyInternalExports: false
    }
  }))
);
