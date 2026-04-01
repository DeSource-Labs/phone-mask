import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { builtinModules, createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import { rspack } from '@rspack/core';

const execFileAsync = promisify(execFile);
const DEFAULT_INSTALL_TIMEOUT_MS = 120_000;
const SVELTE_BUILD_TIMEOUT_MS = 180_000;
const SVELTE_FALLBACK_VITE_VERSION = '^8.0.0';
const SVELTE_FALLBACK_PLUGIN_VERSION = '^7.0.0';
const SVELTE_FALLBACK_SVELTE_VERSION = '^5.0.0';
const BUILTIN_EXTERNALS = new Set([...builtinModules, ...builtinModules.map((mod) => `node:${mod}`)]);
const CSS_LOADER_PATH = createRequire(import.meta.url).resolve('css-loader');
const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;

/**
 * @typedef {{ installTimeout?: number }} StatsOptions
 */

/**
 * @typedef {{ assets?: Array<{ name?: string, size?: number, gzip?: number }>, size?: number, gzip?: number }} PackageStatsPayload
 */

/**
 * Normalizes options to the subset we support.
 * @param {StatsOptions | undefined} options
 * @returns {{ installTimeout: number }}
 */
function normalizeOptions(options) {
  const installTimeout = Number.isFinite(options?.installTimeout)
    ? Number(options.installTimeout)
    : DEFAULT_INSTALL_TIMEOUT_MS;
  return { installTimeout };
}

/**
 * Removes a temporary directory with retries to avoid transient filesystem races.
 * @param {string} dirPath
 * @returns {Promise<void>}
 */
async function removeDirSafe(dirPath) {
  await rm(dirPath, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100
  });
}

/**
 * Returns package.json path inside node_modules for a package spec.
 * @param {string} installRoot
 * @param {string} pkg
 * @returns {string}
 */
function getInstalledManifestPath(installRoot, pkg) {
  return path.join(installRoot, 'node_modules', ...pkg.split('/'), 'package.json');
}

/**
 * Reads installed package manifest.
 * @param {string} installRoot
 * @param {string} pkg
 * @returns {Promise<Record<string, unknown>>}
 */
async function readInstalledManifest(installRoot, pkg) {
  const manifestPath = getInstalledManifestPath(installRoot, pkg);
  const raw = await readFile(manifestPath, 'utf8');
  return /** @type {Record<string, unknown>} */ (JSON.parse(raw));
}

/**
 * Installs package (and optionally peers) inside temp project.
 * @param {string} pkg
 * @param {{ installTimeout: number }} options
 * @returns {Promise<{ installRoot: string, manifest: Record<string, unknown>, peerDeps: Set<string> }>}
 */
async function createInstallRoot(pkg, options) {
  const installRoot = await mkdtemp(path.join(tmpdir(), 'phone-mask-stats-'));
  const manifest = {
    name: 'phone-mask-stats-temp',
    private: true,
    version: '0.0.0',
    type: 'module'
  };

  await writeFile(path.join(installRoot, 'package.json'), JSON.stringify(manifest, null, 2));
  await execFileAsync('pnpm', ['add', '-D', '--ignore-scripts', '--save-exact', pkg], {
    cwd: installRoot,
    timeout: options.installTimeout
  });

  const pkgManifest = await readInstalledManifest(installRoot, pkg);
  const peerDepsObject =
    pkgManifest.peerDependencies && typeof pkgManifest.peerDependencies === 'object'
      ? pkgManifest.peerDependencies
      : {};
  const peerDeps = new Set(Object.keys(peerDepsObject));

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

/**
 * Detects whether root export is Svelte-only.
 * @param {Record<string, unknown>} manifest
 * @returns {boolean}
 */
function hasSvelteOnlyRootExport(manifest) {
  const exportsField = manifest.exports;
  if (!exportsField || typeof exportsField !== 'object' || Array.isArray(exportsField)) return false;

  const rootExport =
    '.' in exportsField && exportsField['.'] && typeof exportsField['.'] === 'object' ? exportsField['.'] : null;
  if (!rootExport || Array.isArray(rootExport)) return false;

  const hasSvelte = typeof rootExport.svelte === 'string';
  const hasImport = typeof rootExport.import === 'string';
  const hasDefault = typeof rootExport.default === 'string';
  const hasRequire = typeof rootExport.require === 'string';
  return hasSvelte && !hasImport && !hasDefault && !hasRequire;
}

/**
 * Measures bundle output from esbuild for a given entry source.
 * @param {{ installRoot: string, entrySource: string, peerDeps: Set<string> }} input
 * @returns {Promise<{ size: number, gzip: number } | null>}
 */
async function measureWithEsbuild(input) {
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

/**
 * Creates base esbuild external set from peer deps and Node builtins.
 * @param {Set<string>} peerDeps
 * @returns {Set<string>}
 */
function createExternalSet(peerDeps) {
  return new Set([...Array.from(peerDeps), ...Array.from(peerDeps).map((dep) => `${dep}/*`), ...BUILTIN_EXTERNALS]);
}

/**
 * Runs esbuild and progressively externalizes unresolved imports.
 * @param {{ installRoot: string, entryFile: string, externalSet: Set<string> }} input
 * @returns {Promise<import('esbuild').BuildResult>}
 */
async function runEsbuildWithRetries(input) {
  const { installRoot, entryFile, externalSet } = input;
  /** @type {unknown} */
  let result = null;
  /** @type {unknown} */
  let lastError = null;

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

/**
 * Executes one esbuild bundle attempt.
 * @param {string} installRoot
 * @param {string} entryFile
 * @param {Set<string>} externalSet
 * @returns {Promise<import('esbuild').BuildResult>}
 */
function buildEsbuildOnce(installRoot, entryFile, externalSet) {
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

/**
 * Adds unresolved imports (and their package patterns) to external set.
 * @param {Set<string>} unresolved
 * @param {Set<string>} externalSet
 * @returns {boolean}
 */
function addUnresolvedToExternalSet(unresolved, externalSet) {
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

/**
 * Returns external candidates for a given unresolved import id.
 * @param {string} id
 * @returns {string[]}
 */
function getExternalCandidates(id) {
  const packageName = getPackageNameFromImportId(id);
  if (!packageName) return [id];
  return [id, packageName, `${packageName}/*`];
}

/**
 * Converts esbuild output into size metrics.
 * @param {import('esbuild').BuildResult} result
 * @returns {{ size: number, gzip: number } | null}
 */
function getEsbuildOutputMetrics(result) {
  if (!result.outputFiles || result.outputFiles.length === 0) return null;
  const mainOutput = findPreferredOutputFile(result.outputFiles);
  if (!mainOutput) return null;

  const size = mainOutput.contents.length;
  const gzip = gzipSync(mainOutput.contents).length;
  if (size === 0 || gzip === 0) return null;
  return { size, gzip };
}

/**
 * Chooses CSS output first, then JS output.
 * @param {Array<{ path?: string, contents: Uint8Array }>} outputFiles
 * @returns {{ path?: string, contents: Uint8Array } | undefined}
 */
function findPreferredOutputFile(outputFiles) {
  return (
    outputFiles.find((file) => path.extname(file.path || '') === '.css') ??
    outputFiles.find((file) => path.extname(file.path || '') === '.js')
  );
}

/**
 * Returns package name from bare import id.
 * Examples: "react/jsx-runtime" -> "react", "@nuxt/kit/foo" -> "@nuxt/kit".
 * @param {string} id
 * @returns {string | null}
 */
function getPackageNameFromImportId(id) {
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

/**
 * Checks whether import id is a bare package specifier.
 * @param {string} id
 * @returns {boolean}
 */
function isBareImportId(id) {
  if (!id) return false;
  if (id.startsWith('.') || id.startsWith('/') || id.startsWith('node:')) return false;
  if (/^[A-Za-z]:[\\/]/.test(id)) return false;
  return true;
}

/**
 * Escapes regex meta chars in a string.
 * @param {string} value
 * @returns {string}
 */
function escapeRegex(value) {
  return value.replace(ESCAPE_REGEX, String.raw`\$&`);
}

/**
 * Extracts unresolved bare imports from esbuild error shape.
 * @param {unknown} error
 * @returns {Set<string>}
 */
function extractUnresolvedBareImports(error) {
  const unresolved = new Set();
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

/**
 * Extracts unresolved bare imports from rspack compilation errors.
 * @param {Array<unknown>} errors
 * @returns {Set<string>}
 */
function extractUnresolvedFromRspackErrors(errors) {
  const unresolved = new Set();
  for (const error of errors) {
    const message = getRspackErrorMessage(error);
    if (!message) continue;

    const importId = extractRspackMissingImport(message);
    if (importId && isBareImportId(importId)) unresolved.add(importId);
  }
  return unresolved;
}

/**
 * Returns normalized message from rspack error object.
 * @param {unknown} error
 * @returns {string}
 */
function getRspackErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (!error || typeof error !== 'object') return '';
  if (!('message' in error)) return '';
  return String(error.message);
}

/**
 * Extracts unresolved import id from rspack message string.
 * @param {string} message
 * @returns {string | null}
 */
function extractRspackMissingImport(message) {
  const cantResolve = /Can't resolve '([^']+)'/.exec(message);
  if (cantResolve) return cantResolve[1];
  const couldNotResolve = /Could not resolve "([^"]+)"/.exec(message);
  if (couldNotResolve) return couldNotResolve[1];
  return null;
}

/**
 * Chooses main built asset (css preferred) and returns size/gzip.
 * @param {string} distDir
 * @returns {Promise<{ size: number, gzip: number } | null>}
 */
async function pickMainAssetSize(distDir) {
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

/**
 * Builds package via rspack with missing-dependency externalization retries.
 * @param {{ installRoot: string, entrySource: string, peerDeps: Set<string> }} input
 * @returns {Promise<{ size: number, gzip: number } | null>}
 */
async function measureWithRspack(input) {
  const { installRoot, entrySource, peerDeps } = input;
  const entryFile = path.join(installRoot, 'entry.mjs');
  const distDir = path.join(installRoot, 'dist');
  await writeFile(entryFile, entrySource);

  const externalPackages = new Set(Array.from(peerDeps));
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
          `Rspack build failed with ${compilationErrors.length} errors: ${String(compilationErrors[0]?.message || compilationErrors[0])}`
        );
      }
      continue;
    }

    return await pickMainAssetSize(distDir);
  }

  throw new Error('Rspack fallback failed after retries');
}

/**
 * Creates regex to match external package ids and subpaths.
 * @param {Set<string>} externalPackages
 * @returns {RegExp | null}
 */
function createExternalPackagesRegex(externalPackages) {
  if (externalPackages.size === 0) return null;
  const pattern = Array.from(externalPackages)
    .map((dep) => String.raw`^${escapeRegex(dep)}$|^${escapeRegex(dep)}\/`)
    .join('|');
  return new RegExp(`(${pattern})`);
}

/**
 * Builds rspack config object for benchmark compilation.
 * @param {{ entryFile: string, distDir: string, externalRegex: RegExp | null, externalBuiltIns: Set<string> }} input
 * @returns {import('@rspack/core').Configuration}
 */
function createRspackConfig(input) {
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
    externals: ({ request }, callback) => {
      const req = request || '';
      const isPeer = externalRegex ? externalRegex.test(req) : false;
      const isBuiltIn = externalBuiltIns.has(req);
      if (isPeer || isBuiltIn) {
        callback(undefined, `commonjs ${req}`);
      } else {
        callback(undefined);
      }
    }
  };
}

/**
 * Runs rspack build and closes compiler.
 * @param {import('@rspack/core').Configuration} config
 * @returns {Promise<any>}
 */
async function runRspackBuild(config) {
  const compiler = rspack(config);
  try {
    return await new Promise((resolve, reject) => {
      compiler.run((error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error('Rspack returned empty stats'));
          return;
        }
        resolve(result);
      });
    });
  } finally {
    await new Promise((resolve, reject) => {
      compiler.close((error) => {
        if (error) reject(error);
        else resolve(undefined);
      });
    });
  }
}

/**
 * Reads compilation errors from rspack stats.
 * @param {any} stats
 * @returns {Array<unknown>}
 */
function getRspackCompilationErrors(stats) {
  return Array.isArray(stats?.compilation?.errors) ? stats.compilation.errors : [];
}

/**
 * Adds unresolved package names into external package set.
 * @param {Set<string>} unresolved
 * @param {Set<string>} externalPackages
 * @returns {boolean}
 */
function addUnresolvedPackagesToExternalSet(unresolved, externalPackages) {
  let changed = false;
  for (const id of unresolved) {
    const packageName = getPackageNameFromImportId(id);
    if (!packageName || externalPackages.has(packageName)) continue;
    externalPackages.add(packageName);
    changed = true;
  }
  return changed;
}

/**
 * Svelte fallback measurement for Svelte-only export maps.
 * @param {{ pkg: string, installTimeout: number, entrySource: string }} input
 * @returns {Promise<{ size: number, gzip: number } | null>}
 */
async function measureWithSvelteVite(input) {
  const { pkg, installTimeout, entrySource } = input;
  const tmpRoot = await mkdtemp(path.join(tmpdir(), 'phone-mask-svelte-stats-'));

  try {
    const packageJson = {
      name: 'phone-mask-svelte-stats',
      private: true,
      version: '0.0.0',
      type: 'module'
    };

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
        pkg
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

/**
 * Measures package import size via local fallback.
 * @param {string} pkg
 * @param {{ installTimeout: number }} options
 * @returns {Promise<{ size: number, gzip: number } | null>}
 */
async function measurePackageFallback(pkg, options) {
  const { installRoot, manifest, peerDeps } = await createInstallRoot(pkg, options);
  try {
    const entrySource = `import * as benchmarkPackage from ${JSON.stringify(pkg)};\nconsole.log(Object.keys(benchmarkPackage).length);\n`;

    if (hasSvelteOnlyRootExport(manifest)) {
      return await measureWithSvelteVite({
        pkg,
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

/**
 * Attempts to discover exported symbol names for per-export sizing.
 * @param {string} pkg
 * @param {string} installRoot
 * @param {number} installTimeout
 * @returns {Promise<string[]>}
 */
async function discoverExportNames(pkg, installRoot, installTimeout) {
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

/**
 * Measures export-level sizes via local fallback.
 * @param {string} pkg
 * @param {{ installTimeout: number }} options
 * @returns {Promise<PackageStatsPayload>}
 */
async function measureExportSizesFallback(pkg, options) {
  const { installRoot, manifest, peerDeps } = await createInstallRoot(pkg, options);
  try {
    if (hasSvelteOnlyRootExport(manifest)) {
      return { assets: [] };
    }

    const exportNames = await discoverExportNames(pkg, installRoot, options.installTimeout);
    if (exportNames.length === 0) {
      return { assets: [] };
    }

    /** @type {Array<{ name: string, size: number, gzip: number }>} */
    const assets = [];

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

/**
 * Gets package stats.
 * Stable replacement for package-build-stats getPackageStats
 *
 * @param {string} pkg
 * @param {StatsOptions} [options]
 * @returns {Promise<PackageStatsPayload>}
 */
export async function getPackageStats(pkg, options = {}) {
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

/**
 * Gets export-level stats.
 * Stable replacement for package-build-stats getPackageExportSizes
 *
 * @param {string} pkg
 * @param {StatsOptions} [options]
 * @returns {Promise<PackageStatsPayload>}
 */
export async function getPackageExportSizes(pkg, options = {}) {
  const normalized = normalizeOptions(options);
  return await measureExportSizesFallback(pkg, normalized);
}
