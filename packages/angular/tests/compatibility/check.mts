import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { argv, env, execPath } from 'node:process';

const [angular, typescript] = argv.slice(2);
if (![angular, typescript].every((version) => /^\d+\.\d+\.\d+$/.test(version ?? ''))) {
  throw new Error('Usage: pnpm test:compat <angular-version> <typescript-version>');
}
const root = resolve(import.meta.dirname, '../..');
const directory = await mkdtemp(join(tmpdir(), 'phone-mask-angular-compat-'));
const pnpm = env.npm_execpath ?? 'pnpm';
function run(args: string[], cwd = directory): void {
  const script = /\.[cm]?js$/.test(pnpm);
  execFileSync(script ? execPath : pnpm, script ? [pnpm, ...args] : args, { cwd, stdio: 'inherit' });
}

try {
  run(['pack', '--out', join(directory, 'core.tgz'), '--silent'], resolve(root, '../core'));
  run(['pack', '--out', join(directory, 'angular.tgz'), '--silent'], root);
  const dependencies = Object.fromEntries(
    ['common', 'compiler', 'compiler-cli', 'core', 'forms', 'platform-browser', 'platform-server', 'animations'].map(
      (name) => [`@angular/${name}`, angular]
    )
  );
  Object.assign(dependencies, {
    '@desource/phone-mask': 'file:./core.tgz',
    '@desource/phone-mask-angular': 'file:./angular.tgz',
    typescript,
    rxjs: '7.8.2',
    tslib: '2.8.1'
  });
  await writeFile(
    join(directory, 'package.json'),
    JSON.stringify({
      private: true,
      type: 'module',
      dependencies
    })
  );
  await writeFile(join(directory, 'pnpm-workspace.yaml'), "overrides:\n  '@desource/phone-mask': file:./core.tgz\n");
  run(['install', '--ignore-scripts']);
  await cp(join(import.meta.dirname, 'consumer.ts'), join(directory, 'consumer.ts'));
  await writeFile(
    join(directory, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ES2022',
        moduleResolution: 'bundler',
        strict: true,
        skipLibCheck: false,
        experimentalDecorators: true,
        useDefineForClassFields: false,
        outDir: 'out',
        types: []
      },
      angularCompilerOptions: { strictTemplates: true, strictInjectionParameters: true },
      files: ['consumer.ts']
    })
  );
  run(['exec', 'ngc', '-p', 'tsconfig.json']);
  await writeFile(
    join(directory, 'render.mjs'),
    `
import '@angular/compiler';
import assert from 'node:assert/strict';
import { rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import linker from '@angular/compiler-cli/linker/babel';
import * as core from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication, provideServerRendering } from '@angular/platform-server';
const library = './node_modules/@desource/phone-mask-angular/fesm2022/desource-phone-mask-angular.mjs';
const { transformFileAsync } = createRequire(import.meta.resolve('@angular/compiler-cli/package.json'))('@babel/core');
const linked = await transformFileAsync(library, { plugins: [linker], configFile: false, babelrc: false });
assert.ok(linked?.code && !linked.code.includes('ɵɵngDeclareComponent'));
await rm(library);
await writeFile(library, linked.code);
const { Consumer } = await import('./out/consumer.js');
const zoneless = core.provideZonelessChangeDetection ?? core.provideExperimentalZonelessChangeDetection;
let fetches = 0;
globalThis.fetch = () => { fetches++; return Promise.reject(new Error('SSR must not fetch')); };
const html = await renderApplication(
  (context) => bootstrapApplication(Consumer, { providers: [zoneless(), provideServerRendering()] }, context),
  { document: '<html><body><consumer-app></consumer-app></body></html>', url: 'http://localhost/', allowedHosts: ['localhost'] }
);
for (const value of ['202-555-0123', '415-555-2671', '650-555-1234', '212-555-7890']) assert.ok(html.includes('value="' + value + '"'));
assert.ok(html.includes('+1 202-555-0123') && html.includes('theme-light'));
assert.ok(html.includes('🇺🇸 +1 234 567 8888') && html.includes('🇺🇸 234 567 8888'));
assert.ok(html.includes('🇰🇿 +7 12345 6 77 88'));
assert.equal(fetches, 0);
assert.equal('Zone' in globalThis, false);
console.log('Angular ' + core.VERSION.full + ': strict types, linker, and zoneless SSR passed');
`
  );
  execFileSync(execPath, ['render.mjs'], { cwd: directory, stdio: 'inherit' });
} finally {
  await rm(directory, { recursive: true, force: true });
}
