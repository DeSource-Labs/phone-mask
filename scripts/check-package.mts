import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = mkdtempSync(join(tmpdir(), 'phone-mask-package-'));
const tarball = join(directory, 'package.tgz');
const pnpm = process.env.npm_execpath ?? 'pnpm';

function run(args: string[]) {
  const isScript = /\.[cm]?js$/.test(pnpm);
  execFileSync(isScript ? process.execPath : pnpm, isScript ? [pnpm, ...args] : args, { stdio: 'inherit' });
}

try {
  run(['pack', '--out', tarball, '--silent']);
  run(['exec', 'publint', tarball, '--strict']);
  run(['exec', 'attw', tarball, ...process.argv.slice(2), '--exclude-entrypoints', 'assets/lib.css', 'package.json']);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
