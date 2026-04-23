import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { builtinModules, createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { gzipSync } from 'node:zlib';
import { build, type BuildResult, type OutputFile } from 'esbuild';
import { rspack, type Configuration } from '@rspack/core';

type ExecFileAsync = (
  file: string,
  args: string[],
  options?: { cwd?: string; timeout?: number }
) => Promise<{ stdout: string; stderr: string }>;
type InstallOverrides = Record<string, string>;
type StatsOptions = {
  installTimeout?: number;
  installSpec?: string;
  installOverrides?: InstallOverrides;
};
type NormalizedStatsOptions = {
  installTimeout: number;
  installSpec?: string;
  installOverrides?: InstallOverrides;
};
type PackageStatsAsset = {
  name?: string;
  size?: number;
  gzip?: number;
};
export type PackageStatsPayload = {
  assets?: PackageStatsAsset[];
  size?: number;
  gzip?: number;
};
type InstallRoot = {
  installRoot: string;
  manifest: Record<string, unknown>;
  peerDeps: Set<string>;
};
type MeasuredSize = {
  size: number;
  gzip: number;
};
type PackageMeasureInput = {
  installRoot: string;
  entrySource: string;
  peerDeps: Set<string>;
};
type EsbuildRetryInput = {
  installRoot: string;
  entryFile: string;
  externalSet: Set<string>;
};
type PreferredOutputFile = Pick<OutputFile, 'path' | 'contents'>;
type RspackConfigInput = {
  entryFile: string;
  distDir: string;
  externalRegex: RegExp | null;
  externalBuiltIns: Set<string>;
};
type RspackExternalContext = {
  request?: string;
};
type RspackStatsLike = {
  compilation?: {
    errors?: unknown[];
  };
};
type SvelteMeasureInput = {
  pkg: string;
  installSpec?: string;
  installOverrides?: InstallOverrides;
  installTimeout: number;
  entrySource: string;
};
type TempInstallManifest = {
  name: string;
  private: true;
  version: string;
  type: 'module';
  pnpm?: {
    overrides: InstallOverrides;
  };
};

const execFileAsync = promisify(execFile) as ExecFileAsync;
const DEFAULT_INSTALL_TIMEOUT_MS = 120_000;
const SVELTE_BUILD_TIMEOUT_MS = 180_000;
const SVELTE_FALLBACK_VITE_VERSION = '^8.0.0';
const SVELTE_FALLBACK_PLUGIN_VERSION = '^7.0.0';
const SVELTE_FALLBACK_SVELTE_VERSION = '^5.0.0';
const BUILTIN_EXTERNALS = new Set<string>([...builtinModules, ...builtinModules.map((mod) => `node:${mod}`)]);
const CSS_LOADER_PATH = createRequire(import.meta.url).resolve('css-loader');
const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;

function normalizeOptions(options: StatsOptions | undefined): NormalizedStatsOptions {
  const rawInstallTimeout = options?.installTimeout;
  const installTimeout = Number.isFinite(rawInstallTimeout) ? Number(rawInstallTimeout) : DEFAULT_INSTALL_TIMEOUT_MS;
  const installSpec = typeof options?.installSpec === 'string' && options.installSpec ? options.installSpec : undefined;
  const installOverrides =
    options?.installOverrides && Object.keys(options.installOverrides).length > 0
      ? options.installOverrides
      : undefined;
  return { installTimeout, installSpec, installOverrides };
}

function createTempInstallManifest(installOverrides: InstallOverrides | undefined): TempInstallManifest {
  const manifest: TempInstallManifest = {
    name: 'phone-mask-stats-temp',
    private: true,
    version: '0.0.0',
    type: 'module'
  };

  if (installOverrides) {
    manifest.pnpm = {
      overrides: installOverrides
    };
  }

  return manifest;
}

async function removeDirSafe(dirPath: string): Promise<void> {
  await rm(dirPath, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100
  });
}

function getInstalledManifestPath(installRoot: string, pkg: string): string {
  return path.join(installRoot, 'node_modules', ...pkg.split('/'), 'package.json');
}

async function readInstalledManifest(installRoot: string, pkg: string): Promise<Record<string, unknown>> {
  const manifestPath = getInstalledManifestPath(installRoot, pkg);
  const raw = await readFile(manifestPath, 'utf8');
  return JSON.parse(raw) as Record<string, unknown>;
}

async function createInstallRoot(pkg: string, options: NormalizedStatsOptions): Promise<InstallRoot> {
  const installRoot = await mkdtemp(path.join(tmpdir(), 'phone-mask-stats-'));
  const dependencySpec = options.installSpec ?? pkg;
  const manifest = createTempInstallManifest(options.installOverrides);

  await writeFile(path.join(installRoot, 'package.json'), JSON.stringify(manifest, null, 2));
  await execFileAsync('pnpm', ['add', '-D', '--ignore-scripts', '--save-exact', dependencySpec], {
    cwd: installRoot,
    timeout: options.installTimeout
  });

  const pkgManifest = await readInstalledManifest(installRoot, pkg);
  const peerDepsObject =
    pkgManifest.peerDependencies && typeof pkgManifest.peerDependencies === 'object'
      ? pkgManifest.peerDependencies
      : {};
  const peerDeps = new Set<string>(Object.keys(peerDepsObject));

  // Install peers to avoid module-resolution failures during export discovery/build.
  if (peerDeps.size > 0) {
    try {
      await execFileAsync('pnpm', ['add', '-D', '--ignore-scripts', '--save-exact', ...Array.from(peerDeps)], {
        cwd: installRoot,
        timeout: options.installTimeout
      });
    } catch {
      // Keep going: peers are still treated as externals during build.
    }
  }

  return { installRoot, manifest: pkgManifest, peerDeps };
}

function hasSvelteOnlyRootExport(manifest: Record<string, unknown>): boolean {
  const exportsField = manifest.exports;
  if (!exportsField || typeof exportsField !== 'object' || Array.isArray(exportsField)) return false;

  const exportsRecord = exportsField as Record<string, unknown>;
  const rootExport =
    '.' in exportsRecord && exportsRecord['.'] && typeof exportsRecord['.'] === 'object'
      ? (exportsRecord['.'] as Record<string, unknown>)
      : null;
  if (!rootExport || Array.isArray(rootExport)) return false;

  const hasSvelte = typeof rootExport.svelte === 'string';
  const hasImport = typeof rootExport.import === 'string';
  const hasDefault = typeof rootExport.default === 'string';
  const hasRequire = typeof rootExport.require === 'string';
  return hasSvelte && !hasImport && !hasDefault && !hasRequire;
}

async function measureWithEsbuild(input: PackageMeasureInput): Promise<MeasuredSize | null> {
  const { installRoot, entrySource, peerDeps } = input;
  const entryFile = path.join(installRoot, 'entry.mjs');
  await writeFile(entryFile, entrySource);
  const externalSet = createExternalSet(peerDeps);
  const result = await runEsbuildWithRetries({
    installRoot,
    entryFile,
    externalSet
  });
  return getEsbuildOutputMetrics(result);
}

function createExternalSet(peerDeps: Set<string>): Set<string> {
  return new Set([...Array.from(peerDeps), ...Array.from(peerDeps).map((dep) => `${dep}/*`), ...BUILTIN_EXTERNALS]);
}

async function runEsbuildWithRetries(input: EsbuildRetryInput): Promise<BuildResult> {
  const { installRoot, entryFile, externalSet } = input;
  let result: BuildResult | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      result = await buildEsbuildOnce(installRoot, entryFile, externalSet);
      break;
    } catch (error) {
      lastError = error;
      const unresolved = extractUnresolvedBareImports(error);
      if (unresolved.size === 0 || !addUnresolvedToExternalSet(unresolved, externalSet)) {
        throw error;
      }
    }
  }

  if (!result) {
    throw lastError instanceof Error ? lastError : new Error('esbuild fallback failed');
  }

  return result;
}

function buildEsbuildOnce(installRoot: string, entryFile: string, externalSet: Set<string>): Promise<BuildResult> {
  return build({
    absWorkingDir: installRoot,
    entryPoints: [entryFile],
    outdir: 'dist',
    entryNames: '[name].bundle',
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'browser',
    write: false,
    treeShaking: true,
    logLevel: 'silent',
    target: ['es2020'],
    external: Array.from(externalSet)
  });
}

function addUnresolvedToExternalSet(unresolved: Set<string>, externalSet: Set<string>): boolean {
  let changed = false;
  for (const id of unresolved) {
    for (const candidate of getExternalCandidates(id)) {
      if (externalSet.has(candidate)) continue;
      externalSet.add(candidate);
      changed = true;
    }
  }
  return changed;
}

function getExternalCandidates(id: string): string[] {
  const packageName = getPackageNameFromImportId(id);
  if (!packageName) return [id];
  return [id, packageName, `${packageName}/*`];
}

function getEsbuildOutputMetrics(result: BuildResult): MeasuredSize | null {
  if (!result.outputFiles || result.outputFiles.length === 0) return null;
  const mainOutput = findPreferredOutputFile(result.outputFiles);
  if (!mainOutput) return null;

  const size = mainOutput.contents.length;
  const gzip = gzipSync(mainOutput.contents).length;
  if (size === 0 || gzip === 0) return null;
  return { size, gzip };
}

function findPreferredOutputFile(outputFiles: OutputFile[]): PreferredOutputFile | undefined {
  return (
    outputFiles.find((file) => path.extname(file.path || '') === '.css') ??
    outputFiles.find((file) => path.extname(file.path || '') === '.js')
  );
}

function getPackageNameFromImportId(id: string): string | null {
  if (!id) return null;
  const clean = id.split('?')[0].split('#')[0];
  if (!isBareImportId(clean)) return null;
  if (!clean.includes('/')) return clean;
  if (clean.startsWith('@')) {
    const [scope, name] = clean.split('/');
    return scope && name ? `${scope}/${name}` : clean;
  }
  return clean.split('/')[0];
}

function isBareImportId(id: string): boolean {
  if (!id) return false;
  if (id.startsWith('.') || id.startsWith('/') || id.startsWith('node:')) return false;
  if (/^[A-Za-z]:[\\/]/.test(id)) return false;
  return true;
}

function escapeRegex(value: string): string {
  return value.replace(ESCAPE_REGEX, String.raw`\$&`);
}

function extractUnresolvedBareImports(error: unknown): Set<string> {
  const unresolved = new Set<string>();
  if (!error || typeof error !== 'object') return unresolved;
  const maybeErrors = 'errors' in error ? error.errors : null;
  if (!Array.isArray(maybeErrors)) return unresolved;

  for (const item of maybeErrors) {
    if (!item || typeof item !== 'object') continue;
    const text = 'text' in item && typeof item.text === 'string' ? item.text : '';
    const match = /Could not resolve "([^"]+)"/.exec(text);
    if (!match) continue;
    const importId = match[1];
    if (!isBareImportId(importId)) continue;
    unresolved.add(importId);
  }

  return unresolved;
}

function extractUnresolvedFromRspackErrors(errors: unknown[]): Set<string> {
  const unresolved = new Set<string>();
  for (const error of errors) {
    const message = getRspackErrorMessage(error);
    if (!message) continue;

    const importId = extractRspackMissingImport(message);
    if (importId && isBareImportId(importId)) unresolved.add(importId);
  }
  return unresolved;
}

function getRspackErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (!error || typeof error !== 'object') return '';
  if (!('message' in error)) return '';
  return String(error.message);
}

function extractRspackMissingImport(message: string): string | null {
  const cantResolve = /Can't resolve '([^']+)'/.exec(message);
  if (cantResolve) return cantResolve[1];
  const couldNotResolve = /Could not resolve "([^"]+)"/.exec(message);
  if (couldNotResolve) return couldNotResolve[1];
  return null;
}

async function pickMainAssetSize(distDir: string): Promise<MeasuredSize | null> {
  const files = await readdir(distDir);
  const cssFile = files.find((name) => name === 'main.bundle.css') ?? null;
  const jsFile = files.find((name) => name === 'main.bundle.js') ?? null;
  const mainFile = cssFile ?? jsFile;
  if (!mainFile) return null;

  const fileContents = await readFile(path.join(distDir, mainFile));
  const size = fileContents.length;
  const gzip = gzipSync(fileContents).length;
  if (size === 0 || gzip === 0) return null;
  return { size, gzip };
}

async function measureWithRspack(input: PackageMeasureInput): Promise<MeasuredSize | null> {
  const { installRoot, entrySource, peerDeps } = input;
  const entryFile = path.join(installRoot, 'entry.mjs');
  const distDir = path.join(installRoot, 'dist');
  await writeFile(entryFile, entrySource);

  const externalPackages = new Set<string>(Array.from(peerDeps));
  const externalBuiltIns = BUILTIN_EXTERNALS;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const config = createRspackConfig({
      entryFile,
      distDir,
      externalRegex: createExternalPackagesRegex(externalPackages),
      externalBuiltIns
    });
    const stats = await runRspackBuild(config);
    const compilationErrors = getRspackCompilationErrors(stats);
    if (compilationErrors.length > 0) {
      const unresolved = extractUnresolvedFromRspackErrors(compilationErrors);
      if (!addUnresolvedPackagesToExternalSet(unresolved, externalPackages)) {
        throw new Error(
          `Rspack build failed with ${compilationErrors.length} errors: ${getRspackErrorMessage(compilationErrors[0]) || String(compilationErrors[0])}`
        );
      }
      continue;
    }

    return await pickMainAssetSize(distDir);
  }

  throw new Error('Rspack fallback failed after retries');
}

function createExternalPackagesRegex(externalPackages: Set<string>): RegExp | null {
  if (externalPackages.size === 0) return null;
  const pattern = Array.from(externalPackages)
    .map((dep) => String.raw`^${escapeRegex(dep)}$|^${escapeRegex(dep)}\/`)
    .join('|');
  return new RegExp(`(${pattern})`);
}

function createRspackConfig(input: RspackConfigInput): Configuration {
  const { entryFile, distDir, externalRegex, externalBuiltIns } = input;
  return {
    mode: 'production',
    devtool: false,
    entry: { main: entryFile },
    output: {
      path: distDir,
      filename: '[name].bundle.js',
      clean: true
    },
    optimization: {
      runtimeChunk: 'multiple',
      realContentHash: false,
      minimize: true,
      usedExports: true,
      sideEffects: true,
      splitChunks: {
        cacheGroups: {
          styles: {
            name: 'main',
            test: /\.css$/,
            chunks: 'all'
          }
        }
      }
    },
    resolve: {
      modules: ['node_modules'],
      extensions: ['.web.mjs', '.mjs', '.web.js', '.js', '.json', '.css', '.sass', '.scss'],
      mainFields: ['browser', 'module', 'main', 'style']
    },
    module: {
      parser: {
        javascript: {
          url: false
        }
      },
      rules: [
        { type: 'javascript/auto', test: /\.mjs$/, use: [] },
        {
          test: /\.css$/,
          type: 'javascript/auto',
          use: [rspack.CssExtractRspackPlugin.loader, CSS_LOADER_PATH]
        }
      ]
    },
    plugins: [
      new rspack.CssExtractRspackPlugin({
        filename: '[name].bundle.css'
      })
    ],
    externals: ({ request }: RspackExternalContext): string | undefined => {
      const req = request || '';
      const isPeer = externalRegex ? externalRegex.test(req) : false;
      const isBuiltIn = externalBuiltIns.has(req);
      return isPeer || isBuiltIn ? `commonjs ${req}` : undefined;
    }
  };
}

async function runRspackBuild(config: Configuration): Promise<RspackStatsLike> {
  const compiler = rspack(config);
  try {
    return await new Promise<RspackStatsLike>((resolve, reject) => {
      compiler.run((error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error('Rspack returned empty stats'));
          return;
        }
        resolve(result as RspackStatsLike);
      });
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      compiler.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

function getRspackCompilationErrors(stats: unknown): unknown[] {
  if (!stats || typeof stats !== 'object') return [];
  const statsRecord = stats as RspackStatsLike;
  return Array.isArray(statsRecord.compilation?.errors) ? statsRecord.compilation.errors : [];
}

function addUnresolvedPackagesToExternalSet(unresolved: Set<string>, externalPackages: Set<string>): boolean {
  let changed = false;
  for (const id of unresolved) {
    const packageName = getPackageNameFromImportId(id);
    if (!packageName || externalPackages.has(packageName)) continue;
    externalPackages.add(packageName);
    changed = true;
  }
  return changed;
}

async function measureWithSvelteVite(input: SvelteMeasureInput): Promise<MeasuredSize | null> {
  const { pkg, installSpec, installOverrides, installTimeout, entrySource } = input;
  const tmpRoot = await mkdtemp(path.join(tmpdir(), 'phone-mask-svelte-stats-'));
  const dependencySpec = installSpec ?? pkg;

  try {
    const packageJson = createTempInstallManifest(installOverrides);
    packageJson.name = 'phone-mask-svelte-stats';

    await writeFile(path.join(tmpRoot, 'package.json'), JSON.stringify(packageJson, null, 2));
    await writeFile(
      path.join(tmpRoot, 'index.html'),
      '<!doctype html><html><body><script type="module" src="/entry.js"></script></body></html>'
    );
    await writeFile(path.join(tmpRoot, 'entry.js'), entrySource);
    await writeFile(
      path.join(tmpRoot, 'vite.config.mjs'),
      [
        "import { defineConfig } from 'vite';",
        "import { svelte } from '@sveltejs/vite-plugin-svelte';",
        '',
        'export default defineConfig({',
        '  plugins: [svelte()],',
        '  build: {',
        "    outDir: 'dist',",
        '    emptyOutDir: true,',
        '    minify: true,',
        '    sourcemap: false',
        '  }',
        '});',
        ''
      ].join('\n')
    );

    await execFileAsync(
      'pnpm',
      [
        'add',
        '-D',
        `vite@${SVELTE_FALLBACK_VITE_VERSION}`,
        `@sveltejs/vite-plugin-svelte@${SVELTE_FALLBACK_PLUGIN_VERSION}`,
        `svelte@${SVELTE_FALLBACK_SVELTE_VERSION}`,
        dependencySpec
      ],
      { cwd: tmpRoot, timeout: installTimeout }
    );

    await execFileAsync('pnpm', ['exec', 'vite', 'build'], {
      cwd: tmpRoot,
      timeout: SVELTE_BUILD_TIMEOUT_MS
    });

    const assetsDir = path.join(tmpRoot, 'dist', 'assets');
    const files = await readdir(assetsDir);
    let size = 0;
    let gzip = 0;

    for (const fileName of files) {
      if (!/\.(js|css)$/.test(fileName)) continue;
      const fileContents = await readFile(path.join(assetsDir, fileName));
      size += fileContents.length;
      gzip += gzipSync(fileContents).length;
    }

    if (size === 0 || gzip === 0) return null;
    return { size, gzip };
  } finally {
    await removeDirSafe(tmpRoot);
  }
}

async function measurePackageFallback(pkg: string, options: NormalizedStatsOptions): Promise<MeasuredSize | null> {
  const { installRoot, manifest, peerDeps } = await createInstallRoot(pkg, options);
  try {
    const entrySource = `import * as benchmarkPackage from ${JSON.stringify(pkg)};\nconsole.log(Object.keys(benchmarkPackage).length);\n`;

    if (hasSvelteOnlyRootExport(manifest)) {
      return await measureWithSvelteVite({
        pkg,
        installSpec: options.installSpec,
        installOverrides: options.installOverrides,
        installTimeout: options.installTimeout,
        entrySource
      });
    }

    try {
      return await measureWithRspack({ installRoot, entrySource, peerDeps });
    } catch {
      return await measureWithEsbuild({ installRoot, entrySource, peerDeps });
    }
  } finally {
    await removeDirSafe(installRoot);
  }
}

async function discoverExportNames(pkg: string, installRoot: string, installTimeout: number): Promise<string[]> {
  try {
    const script = `import * as mod from ${JSON.stringify(pkg)}; console.log(JSON.stringify(Object.keys(mod)));`;
    const { stdout } = await execFileAsync('node', ['--input-type=module', '-e', script], {
      cwd: installRoot,
      timeout: installTimeout
    });

    const lines = stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const lastLine = lines.at(-1);
    if (!lastLine) return [];
    const parsed = JSON.parse(lastLine);
    return Array.isArray(parsed) ? parsed.filter((name) => typeof name === 'string' && name !== 'default') : [];
  } catch {
    return [];
  }
}

async function measureExportSizesFallback(pkg: string, options: NormalizedStatsOptions): Promise<PackageStatsPayload> {
  const { installRoot, manifest, peerDeps } = await createInstallRoot(pkg, options);
  try {
    if (hasSvelteOnlyRootExport(manifest)) {
      return { assets: [] };
    }

    const exportNames = await discoverExportNames(pkg, installRoot, options.installTimeout);
    if (exportNames.length === 0) {
      return { assets: [] };
    }

    const assets: PackageStatsAsset[] = [];

    for (const exportName of exportNames) {
      const entrySource = `import { ${exportName} as benchmarkExport } from ${JSON.stringify(pkg)};\nconsole.log(benchmarkExport);\n`;
      let measured = null;
      try {
        measured = await measureWithRspack({ installRoot, entrySource, peerDeps });
      } catch {
        measured = await measureWithEsbuild({ installRoot, entrySource, peerDeps });
      }
      if (!measured) continue;
      assets.push({
        name: exportName,
        size: measured.size,
        gzip: measured.gzip
      });
    }

    return { assets };
  } finally {
    await removeDirSafe(installRoot);
  }
}

export async function getPackageStats(pkg: string, options: StatsOptions = {}): Promise<PackageStatsPayload> {
  const normalized = normalizeOptions(options);
  const measured = await measurePackageFallback(pkg, normalized);
  if (!measured) {
    throw new Error(`Failed to measure package stats for ${pkg} (fallback produced empty output)`);
  }
  return {
    size: measured.size,
    gzip: measured.gzip
  };
}

export async function getPackageExportSizes(pkg: string, options: StatsOptions = {}): Promise<PackageStatsPayload> {
  const normalized = normalizeOptions(options);
  return await measureExportSizesFallback(pkg, normalized);
}
