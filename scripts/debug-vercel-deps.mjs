import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { lstatSync, readdirSync, readFileSync, readlinkSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const angularDir = join(rootDir, 'packages/phone-mask-angular');
const packageNames = [
  '@angular/build',
  '@angular/compiler',
  '@angular/compiler-cli',
  '@angular/core',
  '@desource/phone-mask',
  'ng-packagr',
  'tslib',
  'typescript'
];

function section(title) {
  console.log(`\n[vercel-deps] ${title}`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options
    }).trim();
  } catch (error) {
    return [
      `command failed: ${command} ${args.join(' ')}`,
      error.stdout?.toString().trim(),
      error.stderr?.toString().trim()
    ]
      .filter(Boolean)
      .join('\n');
  }
}

function describePath(path) {
  try {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) return `symlink -> ${readlinkSync(path)}`;
    if (stat.isDirectory()) return 'directory';
    if (stat.isFile()) return 'file';
    return 'exists';
  } catch {
    return 'missing';
  }
}

function listScopedNodeModules(baseDir, scope) {
  const scopeDir = join(baseDir, 'node_modules', scope);

  try {
    return readdirSync(scopeDir).map((name) => `${scope}/${name}`);
  } catch {
    return [];
  }
}

function findPnpmStoreEntries() {
  const storeDir = join(rootDir, 'node_modules/.pnpm');
  const matchers = [
    /^tslib@/,
    /^typescript@/,
    /^ng-packagr@/,
    /^@angular\+build@/,
    /^@angular\+compiler@/,
    /^@angular\+compiler-cli@/,
    /^@angular\+core@/,
    /^@desource\+phone-mask@/
  ];

  try {
    return readdirSync(storeDir)
      .filter((entry) => matchers.some((matcher) => matcher.test(entry)))
      .sort();
  } catch {
    return [];
  }
}

function logDependencies(label, packageJsonPath) {
  const manifest = readJson(packageJsonPath);
  const deps = {
    dependencies: manifest.dependencies ?? {},
    devDependencies: manifest.devDependencies ?? {},
    peerDependencies: manifest.peerDependencies ?? {}
  };

  section(`${label} package dependency names`);
  console.log(JSON.stringify(deps, null, 2));
}

function logNodeModulesLinks(label, baseDir) {
  section(`${label} node_modules entries`);
  const entries = [
    ...packageNames,
    ...listScopedNodeModules(baseDir, '@angular'),
    ...listScopedNodeModules(baseDir, '@desource')
  ];
  const uniqueEntries = [...new Set(entries)].sort();

  for (const name of uniqueEntries) {
    console.log(`${name}: ${describePath(join(baseDir, 'node_modules', name))}`);
  }
}

function logResolution(label, packageJsonPath) {
  section(`${label} require.resolve results`);
  const requireFromPackage = createRequire(packageJsonPath);

  for (const name of packageNames) {
    try {
      const resolved = requireFromPackage.resolve(`${name}/package.json`);
      console.log(`${name}: ${relative(rootDir, resolved)}`);
    } catch (error) {
      console.log(`${name}: unresolved (${error.code ?? error.message})`);
    }
  }
}

section('environment');
console.log(
  JSON.stringify(
    {
      cwd: process.cwd(),
      rootDir,
      INIT_CWD: process.env.INIT_CWD,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      npm_config_user_agent: process.env.npm_config_user_agent,
      node: process.version,
      pnpm: run('pnpm', ['--version'])
    },
    null,
    2
  )
);

logDependencies('root', join(rootDir, 'package.json'));
logDependencies('angular', join(angularDir, 'package.json'));

logNodeModulesLinks('root', rootDir);
logNodeModulesLinks('angular', angularDir);

section('matching node_modules/.pnpm entries');
console.log(findPnpmStoreEntries().join('\n') || 'none');

logResolution('root', join(rootDir, 'package.json'));
logResolution('angular', join(angularDir, 'package.json'));

section('pnpm list for @desource/phone-mask-angular');
console.log(run('pnpm', ['--filter', '@desource/phone-mask-angular', 'list', '--depth', '1']));
