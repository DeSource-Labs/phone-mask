import { execFile } from 'node:child_process';
import { access, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
// Note: this script requires `esbuild`, `@rspack/core` & `css-loader` to be installed
// (e.g. as a dev dependency: `pnpm add -w -D esbuild @rspack/core css-loader`).
import { getPackageExportSizes, getPackageStats } from './stable-package-stats.mts';

type InstallScenario = 'local' | 'npm';
type DependencyMap = Record<string, string>;
type ExportOverheadOverride = {
  package: string;
  exports: string[];
};
type InstallOverrides = Record<string, string>;
type WorkspacePackage = {
  name: string;
  version: string;
  dir: string;
  dependencies: DependencyMap;
  peerDependencies: DependencyMap;
};
type LatestManifest = {
  version: string;
  dependencies: DependencyMap;
  peerDependencies: DependencyMap;
};
type ScenarioContext = {
  installSpec: string;
  installOverrides?: InstallOverrides;
  version: string;
  dependencies: DependencyMap;
  peerDependencies: DependencyMap;
  source: InstallScenario;
};
type SizeMetric = {
  minified: number | null;
  gzip: number | null;
  sizeAvailable: boolean;
};
type ScenarioMetric = {
  version: string;
  source: InstallScenario;
  minified: number | null;
  gzip: number | null;
  sizeAvailable: boolean;
  phoneEngineDeps: string[];
  phoneEnginePeers: string[];
  dataOverheadGzip: number | null;
  totalGzip: number | null;
};
type RegistryVersionManifest = {
  dependencies?: Record<string, unknown>;
  peerDependencies?: Record<string, unknown>;
};
type RegistryMetadata = {
  'dist-tags'?: {
    latest?: string;
  };
  versions?: Record<string, RegistryVersionManifest>;
};

const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url));
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const NPM_REGISTRY = 'https://registry.npmjs.org';
const FETCH_TIMEOUT_MS = 10_000;
const MAX_FETCH_ATTEMPTS = 3;
const PACKAGE_STATS_INSTALL_TIMEOUT_MS = 120_000;
const PHONE_ENGINE_PACKAGES = new Set<string>([
  '@desource/phone-mask',
  'libphonenumber-js',
  'google-libphonenumber',
  'awesome-phonenumber'
]);
const EXPORT_OVERHEAD_OVERRIDES: Record<string, ExportOverheadOverride[]> = {
  '@desource/phone-mask-nuxt': [{ package: '@desource/phone-mask-vue', exports: ['install'] }]
};
const PACKAGE_ORDER = new Map<string, number>([
  ['@desource/phone-mask', 0],
  ['@desource/phone-mask-react', 1],
  ['@desource/phone-mask-vue', 2],
  ['@desource/phone-mask-svelte', 3],
  ['@desource/phone-mask-nuxt', 4]
]);
const execFileAsync = promisify(execFile);

const packTempDirs = new Set<string>();
const localPackSpecCache = new Map<string, Promise<string>>();
let localInstallOverridesPromise: Promise<InstallOverrides> | null = null;
const latestManifestCache = new Map<string, Promise<LatestManifest>>();
const sizeMetricCache = new Map<string, Promise<SizeMetric>>();
const exportMetricCache = new Map<string, Promise<Map<string, number>>>();
const metricCache = new Map<string, Promise<ScenarioMetric>>();

async function cleanupPackTempDirs(): Promise<void> {
  await Promise.all(
    Array.from(packTempDirs, async (dir) => {
      try {
        await rm(dir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup failures.
      }
    })
  );
  packTempDirs.clear();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getLocalPackInstallSpec(pkg: WorkspacePackage): Promise<string> {
  const cached = localPackSpecCache.get(pkg.name);
  if (cached) return cached;

  const task = (async () => {
    const packDir = await mkdtemp(path.join(tmpdir(), 'phone-mask-local-pack-'));
    packTempDirs.add(packDir);
    await execFileAsync('pnpm', ['--filter', pkg.name, 'pack', '--pack-destination', packDir], {
      cwd: ROOT_DIR
    });
    const files = await readdir(packDir);
    const tgz = files.find((name) => name.endsWith('.tgz'));
    if (!tgz) {
      throw new Error(`Failed to create packed tarball for ${pkg.name}`);
    }
    return `file:${path.join(packDir, tgz)}`;
  })();

  localPackSpecCache.set(pkg.name, task);
  return task;
}

function getLocalInstallOverrides(workspacePackages: Map<string, WorkspacePackage>): Promise<InstallOverrides> {
  if (localInstallOverridesPromise) return localInstallOverridesPromise;

  const task = (async () => {
    const entries = await Promise.all(
      Array.from(workspacePackages.values(), async (pkg) => [pkg.name, await getLocalPackInstallSpec(pkg)] as const)
    );
    return Object.fromEntries(entries);
  })();

  localInstallOverridesPromise = task.catch((error) => {
    localInstallOverridesPromise = null;
    throw error;
  });

  return localInstallOverridesPromise;
}

async function readJson<T>(filepath: string): Promise<T> {
  return JSON.parse(await readFile(filepath, 'utf8')) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_FETCH_ATTEMPTS) await sleep(300 * attempt);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch ${url}`);
}

function normalizeDeps(deps: Record<string, unknown> | undefined): DependencyMap {
  if (!deps) return {};

  const normalized: DependencyMap = {};
  for (const [name, version] of Object.entries(deps)) {
    if (typeof version === 'string') {
      normalized[name] = version;
    }
  }
  return normalized;
}

function formatKb(value: number | null | undefined): string {
  return isFiniteNumber(value) ? `${(value / 1024).toFixed(1)} KB` : 'N/A';
}

function formatDelta(localValue: number | null | undefined, npmValue: number | null | undefined): string {
  if (!isFiniteNumber(localValue) || !isFiniteNumber(npmValue) || npmValue === 0) return 'N/A';

  const diff = localValue - npmValue;
  const sign = diff >= 0 ? '+' : '-';
  const absDiff = Math.abs(diff);
  const percent = Math.abs((diff / npmValue) * 100);
  return `${sign}${(absDiff / 1024).toFixed(1)} KB (${sign}${percent.toFixed(2)}%)`;
}

async function loadWorkspacePackages(): Promise<Map<string, WorkspacePackage>> {
  const entries = await readdir(PACKAGES_DIR, { withFileTypes: true });
  const list: WorkspacePackage[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const pkgPath = path.join(PACKAGES_DIR, entry.name, 'package.json');
    try {
      const pkg = await readJson<Record<string, unknown>>(pkgPath);
      const name = typeof pkg.name === 'string' ? pkg.name : null;
      if (!name || !name.startsWith('@desource/phone-mask')) continue;

      list.push({
        name,
        version: typeof pkg.version === 'string' ? pkg.version : String(pkg.version ?? '0.0.0'),
        dir: path.join(PACKAGES_DIR, entry.name),
        dependencies: normalizeDeps(isRecord(pkg.dependencies) ? pkg.dependencies : undefined),
        peerDependencies: normalizeDeps(isRecord(pkg.peerDependencies) ? pkg.peerDependencies : undefined)
      });
    } catch {
      // Ignore folders without valid package.json.
    }
  }

  list.sort((a, b) => {
    const oa = PACKAGE_ORDER.get(a.name) ?? 999;
    const ob = PACKAGE_ORDER.get(b.name) ?? 999;
    if (oa !== ob) return oa - ob;
    return a.name.localeCompare(b.name, 'en');
  });

  return new Map(list.map((item) => [item.name, item]));
}

function fetchLatestManifest(pkg: string): Promise<LatestManifest> {
  const cached = latestManifestCache.get(pkg);
  if (cached) return cached;

  const task = (async () => {
    const metadata = await fetchJson<RegistryMetadata>(`${NPM_REGISTRY}/${encodeURIComponent(pkg)}`);
    const latest = metadata['dist-tags']?.latest;
    const manifest = latest ? metadata.versions?.[latest] : undefined;
    if (!latest || !manifest) {
      throw new Error(`Latest version metadata not found for ${pkg}`);
    }

    return {
      version: latest,
      dependencies: normalizeDeps(manifest.dependencies),
      peerDependencies: normalizeDeps(manifest.peerDependencies)
    };
  })();

  latestManifestCache.set(pkg, task);
  return task;
}

async function resolveScenarioContext(
  scenario: InstallScenario,
  pkg: string,
  workspacePackages: Map<string, WorkspacePackage>
): Promise<ScenarioContext> {
  const localPkg = workspacePackages.get(pkg);
  if (scenario === 'local' && localPkg) {
    const [installSpec, installOverrides] = await Promise.all([
      getLocalPackInstallSpec(localPkg),
      getLocalInstallOverrides(workspacePackages)
    ]);
    return {
      installSpec,
      installOverrides,
      version: localPkg.version,
      dependencies: localPkg.dependencies,
      peerDependencies: localPkg.peerDependencies,
      source: 'local'
    };
  }

  const latest = await fetchLatestManifest(pkg);
  return {
    installSpec: `${pkg}@${latest.version}`,
    version: latest.version,
    dependencies: latest.dependencies,
    peerDependencies: latest.peerDependencies,
    source: 'npm'
  };
}

function fetchSizeMetric(
  scenario: InstallScenario,
  pkg: string,
  workspacePackages: Map<string, WorkspacePackage>
): Promise<SizeMetric> {
  const cacheKey = `${scenario}:${pkg}`;
  const cached = sizeMetricCache.get(cacheKey);
  if (cached) return cached;

  const task = (async () => {
    const context = await resolveScenarioContext(scenario, pkg, workspacePackages);

    try {
      const payload = await getPackageStats(pkg, {
        installTimeout: PACKAGE_STATS_INSTALL_TIMEOUT_MS,
        installSpec: context.installSpec,
        installOverrides: context.installOverrides
      });
      const minified = isFiniteNumber(payload.size) ? payload.size : null;
      const gzip = isFiniteNumber(payload.gzip) ? payload.gzip : null;
      return {
        minified,
        gzip,
        sizeAvailable: minified !== null && gzip !== null
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.info(
        `[${scenario}] size unavailable for ${pkg} (${context.installSpec}). Falling back to N/A. ${message}`
      );
      return {
        minified: null,
        gzip: null,
        sizeAvailable: false
      };
    }
  })();

  sizeMetricCache.set(cacheKey, task);
  return task;
}

function fetchExportGzipMap(
  scenario: InstallScenario,
  pkg: string,
  workspacePackages: Map<string, WorkspacePackage>
): Promise<Map<string, number>> {
  const cacheKey = `${scenario}:${pkg}`;
  const cached = exportMetricCache.get(cacheKey);
  if (cached) return cached;

  const task = (async () => {
    const context = await resolveScenarioContext(scenario, pkg, workspacePackages);
    const payload = await getPackageExportSizes(pkg, {
      installTimeout: PACKAGE_STATS_INSTALL_TIMEOUT_MS,
      installSpec: context.installSpec,
      installOverrides: context.installOverrides
    });
    const assets = Array.isArray(payload.assets) ? payload.assets : [];
    const map = new Map<string, number>();

    for (const asset of assets) {
      if (typeof asset.name !== 'string' || !isFiniteNumber(asset.gzip)) continue;
      map.set(asset.name, asset.gzip);
    }
    return map;
  })();

  const cachedTask = task.catch((error) => {
    exportMetricCache.delete(cacheKey);
    throw error;
  });

  exportMetricCache.set(cacheKey, cachedTask);
  return cachedTask;
}

function fetchScenarioMetric(
  scenario: InstallScenario,
  pkg: string,
  workspacePackages: Map<string, WorkspacePackage>
): Promise<ScenarioMetric> {
  const cacheKey = `${scenario}:${pkg}`;
  const cached = metricCache.get(cacheKey);
  if (cached) return cached;

  const task = (async () => {
    const context = await resolveScenarioContext(scenario, pkg, workspacePackages);
    const size = await fetchSizeMetric(scenario, pkg, workspacePackages);
    const phoneEngineDeps = Object.keys(context.dependencies).filter((dep) => PHONE_ENGINE_PACKAGES.has(dep));
    const phoneEnginePeers = Object.keys(context.peerDependencies).filter((dep) => PHONE_ENGINE_PACKAGES.has(dep));

    return {
      version: context.version,
      source: context.source,
      minified: size.minified,
      gzip: size.gzip,
      sizeAvailable: size.sizeAvailable,
      phoneEngineDeps,
      phoneEnginePeers,
      dataOverheadGzip: null,
      totalGzip: null
    };
  })();

  metricCache.set(cacheKey, task);
  return task;
}

async function resolveOverrideGzip(
  scenario: InstallScenario,
  override: ExportOverheadOverride,
  workspacePackages: Map<string, WorkspacePackage>
): Promise<number | null> {
  try {
    const exportMap = await fetchExportGzipMap(scenario, override.package, workspacePackages);
    let total = 0;
    for (const exportName of override.exports) {
      const gzip = exportMap.get(exportName);
      if (!isFiniteNumber(gzip)) return null;
      total += gzip;
    }
    return total;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.info(
      `[${scenario}] export-size unavailable for ${override.package} (${override.exports.join(', ')}). ${message}`
    );
    return null;
  }
}

async function resolveDataOverheadGzip(
  scenario: InstallScenario,
  pkg: string,
  metric: ScenarioMetric,
  workspacePackages: Map<string, WorkspacePackage>
): Promise<number | null> {
  if (!(metric.sizeAvailable && isFiniteNumber(metric.gzip))) return null;

  const overrides = EXPORT_OVERHEAD_OVERRIDES[pkg] ?? [];
  if (metric.phoneEnginePeers.length === 0 && overrides.length === 0) return 0;

  const coveredPeerPkgs = new Set(overrides.map((item) => item.package));
  let total = 0;

  for (const override of overrides) {
    const value = await resolveOverrideGzip(scenario, override, workspacePackages);
    if (!isFiniteNumber(value)) return null;
    total += value;
  }

  for (const peerPkg of metric.phoneEnginePeers) {
    if (coveredPeerPkgs.has(peerPkg)) continue;

    const peerMetric = await fetchScenarioMetric(scenario, peerPkg, workspacePackages);
    const peerGzip = peerMetric.gzip;
    if (!(peerMetric.sizeAvailable && isFiniteNumber(peerGzip))) return null;
    total += peerGzip;
  }

  return total;
}

async function fetchScenarioMetricWithTotals(
  scenario: InstallScenario,
  pkg: string,
  workspacePackages: Map<string, WorkspacePackage>
): Promise<ScenarioMetric> {
  const metric = await fetchScenarioMetric(scenario, pkg, workspacePackages);
  if (metric.dataOverheadGzip !== null && metric.totalGzip !== null) return metric;

  const overhead = await resolveDataOverheadGzip(scenario, pkg, metric, workspacePackages);
  metric.dataOverheadGzip = overhead;
  metric.totalGzip = isFiniteNumber(overhead) && isFiniteNumber(metric.gzip) ? metric.gzip + overhead : null;
  return metric;
}

async function hasDistDir(packageDir: string): Promise<boolean> {
  try {
    await access(path.join(packageDir, 'dist'));
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const workspacePackages = await loadWorkspacePackages();
  const targetPackageNames = new Set<string>([
    '@desource/phone-mask',
    '@desource/phone-mask-react',
    '@desource/phone-mask-vue',
    '@desource/phone-mask-svelte',
    '@desource/phone-mask-nuxt'
  ]);
  const targets = Array.from(workspacePackages.values()).filter((pkg) => targetPackageNames.has(pkg.name));

  console.info('Local vs npm latest bundle comparison (same benchmark sizing pipeline)');
  console.info('Columns: minified, gzip, data overhead, total gzip');
  console.info('');

  for (const pkg of targets) {
    const distExists = await hasDistDir(pkg.dir);
    if (!distExists) {
      console.info(`[local] ${pkg.name} has no dist folder. Run build first for accurate local comparison.`);
    }

    const localMetric = await fetchScenarioMetricWithTotals('local', pkg.name, workspacePackages);
    const npmMetric = await fetchScenarioMetricWithTotals('npm', pkg.name, workspacePackages);

    console.info(`${pkg.name}`);
    console.info(`  local version: v${localMetric.version} (${localMetric.source})`);
    console.info(`  npm latest:   v${npmMetric.version}`);
    console.info(
      `  minified:     ${formatKb(localMetric.minified)} | npm ${formatKb(npmMetric.minified)} | delta ${formatDelta(localMetric.minified, npmMetric.minified)}`
    );
    console.info(
      `  gzip:         ${formatKb(localMetric.gzip)} | npm ${formatKb(npmMetric.gzip)} | delta ${formatDelta(localMetric.gzip, npmMetric.gzip)}`
    );
    console.info(
      `  data overhead:${formatKb(localMetric.dataOverheadGzip)} | npm ${formatKb(npmMetric.dataOverheadGzip)} | delta ${formatDelta(localMetric.dataOverheadGzip, npmMetric.dataOverheadGzip)}`
    );
    console.info(
      `  total gzip:   ${formatKb(localMetric.totalGzip)} | npm ${formatKb(npmMetric.totalGzip)} | delta ${formatDelta(localMetric.totalGzip, npmMetric.totalGzip)}`
    );
    console.info('');
  }
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.info(`Comparison failed: ${message}`);
  process.exitCode = 1;
} finally {
  await cleanupPackTempDirs();
}
