import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { inspect } from 'node:util';
// Note: this script requires `esbuild`, `@rspack/core` & `css-loader` to be installed
// (e.g. as a dev dependency: `pnpm add -w -D esbuild @rspack/core css-loader`).
import { getPackageExportSizes, getPackageStats } from './stable-package-stats.mts';
import prettier from 'prettier';

const README_PATH = new URL('../README.md', import.meta.url);
const README_FILEPATH = fileURLToPath(README_PATH);
const BENCHMARK_START_MARKER = '<!-- benchmarks:start -->';
const BENCHMARK_END_MARKER = '<!-- benchmarks:end -->';
const EMPTY_DATA = 'N/A';

type GroupRow = {
  pkg: string;
  highlight?: boolean;
};
type GroupDefinition = {
  title: string;
  rows: GroupRow[];
  note?: string;
};
type RepositoryField = string | { url?: string };
type PublishInfo = {
  lastPublished: string | null;
  repositoryUrl: string | null;
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
};
type NpmPackageManifest = {
  repository?: RepositoryField;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};
type NpmMetadata = {
  'dist-tags'?: Record<string, string>;
  versions?: Record<string, NpmPackageManifest>;
  time?: Record<string, string>;
  repository?: RepositoryField;
};
type PackageSizeMetrics = {
  minified: number | null;
  gzip: number | null;
  sizeAvailable: boolean;
};
type ExportOverheadOverride = {
  package: string;
  exports: string[];
};

type PackageMetrics = {
  lastPublished: string | null;
  repositoryUrl: string | null;
  minified: number | null;
  gzip: number | null;
  sizeAvailable: boolean;
  phoneEngineDeps: string[];
  phoneEnginePeers: string[];
  dataOverheadGzip: number | null;
  comparableGzip: number | null;
};

const GROUPS: GroupDefinition[] = [
  {
    title: 'Core (TypeScript/JavaScript)',
    rows: [
      { pkg: '@desource/phone-mask', highlight: true },
      { pkg: 'libphonenumber-js' },
      { pkg: 'google-libphonenumber' },
      { pkg: 'awesome-phonenumber' }
    ]
  },
  {
    title: 'React',
    rows: [
      { pkg: '@desource/phone-mask-react', highlight: true },
      { pkg: 'react-phone-number-input' },
      { pkg: 'react-phone-input-2' },
      { pkg: 'react-international-phone' },
      { pkg: 'mui-tel-input' }
    ],
    note: 'React ecosystem note: `react-international-phone` removed built-in validation in v3 and recommends adding [`google-libphonenumber`](https://www.npmjs.com/package/google-libphonenumber) separately ([migration doc](https://github.com/ybrusentsov/react-international-phone/blob/master/packages/docs/docs/05-Migrations/02-migrate-to-v3.md)). Raw package gzip above does not include that optional validator overhead.'
  },
  {
    title: 'Vue',
    rows: [
      { pkg: '@desource/phone-mask-vue', highlight: true },
      { pkg: 'vue-tel-input' },
      { pkg: 'v-phone-input' },
      { pkg: 'vue-phone-number-input' }
    ]
  },
  {
    title: 'Svelte',
    rows: [{ pkg: '@desource/phone-mask-svelte', highlight: true }, { pkg: 'svelte-tel-input' }]
  },
  {
    title: 'Nuxt',
    rows: [{ pkg: '@desource/phone-mask-nuxt', highlight: true }],
    note: 'Nuxt ecosystem note: there are currently no widely adopted Nuxt-only phone input modules with stable npm + size signals comparable to React/Vue/Svelte peers; most Nuxt apps use Vue phone input packages directly.'
  }
];

const SOURCES = {
  npmRegistry: 'https://registry.npmjs.org',
  bundlephobiaPackage: 'https://bundlephobia.com/package/',
  benchmarkScript: 'https://github.com/DeSource-Labs/phone-mask/blob/main/scripts/update-readme-benchmarks.mts'
};
const MAX_FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 10_000;
const PACKAGE_STATS_CONCURRENCY = 3;
const PACKAGE_STATS_INSTALL_TIMEOUT_MS = 120_000;
const PHONE_ENGINE_PACKAGES = new Set([
  '@desource/phone-mask',
  'libphonenumber-js',
  'google-libphonenumber',
  'awesome-phonenumber'
]);

const PHONE_DATA_SOURCE_LABEL_OVERRIDES: Record<string, string> = {
  'react-international-phone': 'None'
};

const EXPORT_OVERHEAD_OVERRIDES: Record<string, ExportOverheadOverride[]> = {
  'vue-tel-input': [{ package: 'libphonenumber-js', exports: ['parsePhoneNumberFromString'] }],
  '@desource/phone-mask-nuxt': [{ package: '@desource/phone-mask-vue', exports: ['install'] }]
};

function formatKb(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${(value / 1024).toFixed(1)} KB` : EMPTY_DATA;
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().slice(0, 10);
}

function markdownPkg(name: string, highlight = false): string {
  const text = highlight ? `**${name}**` : name;
  return `[${text}](https://www.npmjs.com/package/${name})`;
}

function markdownPkgWithRepo(name: string, highlight: boolean | undefined, repositoryUrl: string | null): string {
  const pkgLink = markdownPkg(name, highlight);
  const repoLink = markdownRepo(repositoryUrl);
  if (repoLink === '-') return pkgLink;
  return `${pkgLink} · ${repoLink}`;
}

function stripGitSuffix(value: string): string {
  return value.replace(/\.git$/i, '');
}

function getRawRepositoryValue(repository: RepositoryField | null | undefined): string | null {
  if (!repository) return null;
  const raw = typeof repository === 'string' ? repository : repository.url;
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

function parseDirectRepositoryUrl(value: string): string | null {
  const transforms: Array<[RegExp, (raw: string) => string]> = [
    [/^git\+https?:\/\//i, (raw) => raw.replace(/^git\+/, '')],
    [/^https?:\/\//i, (raw) => raw],
    [/^git:\/\//i, (raw) => raw.replace(/^git:\/\//i, 'https://')]
  ];

  for (const [pattern, transform] of transforms) {
    if (pattern.test(value)) {
      return stripGitSuffix(transform(value));
    }
  }
  return null;
}

function parseSshRepositoryUrl(value: string): string | null {
  if (!/^(git\+ssh|ssh):\/\//i.test(value)) return null;

  const withoutScheme = value.replace(/^(git\+ssh|ssh):\/\//i, '');
  const withoutUser = withoutScheme.includes('@') ? withoutScheme.slice(withoutScheme.indexOf('@') + 1) : withoutScheme;
  const hostAndPath = withoutUser.replace(':', '/');
  return stripGitSuffix(`https://${hostAndPath}`);
}

function parseScpRepositoryUrl(value: string): string | null {
  const scpLikeMatch = /^([^@]+)@([^:]+):(.+)$/.exec(value);
  if (!scpLikeMatch) return null;
  return stripGitSuffix(`https://${scpLikeMatch[2]}/${scpLikeMatch[3]}`);
}

function parseOwnerRepoShorthand(value: string): string | null {
  if (!/^[\w.-]+\/[\w.-]+$/.test(value)) return null;
  return `https://github.com/${value}`;
}

function validateHttpRepositoryUrl(candidate: string | null): string | null {
  if (!candidate) return null;

  try {
    const normalized = new URL(candidate);
    if (normalized.protocol !== 'http:' && normalized.protocol !== 'https:') {
      return null;
    }
    return normalized.toString();
  } catch {
    return null;
  }
}

function normalizeRepoUrl(repository: RepositoryField | null | undefined): string | null {
  const rawValue = getRawRepositoryValue(repository);
  if (!rawValue) return null;

  const candidate =
    parseDirectRepositoryUrl(rawValue) ??
    parseSshRepositoryUrl(rawValue) ??
    parseScpRepositoryUrl(rawValue) ??
    parseOwnerRepoShorthand(rawValue);

  return validateHttpRepositoryUrl(candidate);
}

function markdownRepo(url: string | null): string {
  if (!url) return '-';
  const safeUrl = url.replaceAll('(', '%28').replaceAll(')', '%29');
  return `[Repo](${safeUrl})`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toLogString(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || value == null) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return inspect(value, { depth: 1, breakLength: 120 });
  }
}

function formatErrorDetails(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return `error=${toLogString(error)}`;
  }

  const err = error as Record<string, unknown>;
  const parts = [`name=${toLogString(err.name)}`, `message=${toLogString(err.message)}`];

  if ('originalError' in err && err.originalError != null) {
    parts.push(`originalError=${toLogString(err.originalError)}`);
  }
  if ('extra' in err && err.extra != null) {
    parts.push(`extra=${toLogString(err.extra)}`);
  }
  if ('cause' in err && err.cause != null) {
    parts.push(`cause=${toLogString(err.cause)}`);
  }
  if ('stack' in err && typeof err.stack === 'string' && err.stack.trim()) {
    const firstLine = err.stack.trim().split('\n')[0];
    parts.push(`stack=${firstLine}`);
  }

  return parts.join(' | ');
}

async function fetchJson<T>(url: string): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          'user-agent': 'phone-mask-readme-benchmarks'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_FETCH_ATTEMPTS) {
        await sleep(300 * attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch JSON from ${url}`);
}

async function mapLimit<T, R>(items: T[], limit: number, mapper: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  };

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

const packageSizeCache = new Map<string, Promise<PackageSizeMetrics>>();

const packageExportGzipCache = new Map<string, Promise<Map<string, number>>>();

function fetchPackageSizeMetrics(pkg: string): Promise<PackageSizeMetrics> {
  const cached = packageSizeCache.get(pkg);
  if (cached) return cached;

  const task: Promise<PackageSizeMetrics> = (async () => {
    try {
      const payload = await getPackageStats(pkg, { installTimeout: PACKAGE_STATS_INSTALL_TIMEOUT_MS });

      const minified = typeof payload.size === 'number' && Number.isFinite(payload.size) ? payload.size : null;
      const gzip = typeof payload.gzip === 'number' && Number.isFinite(payload.gzip) ? payload.gzip : null;
      return {
        minified,
        gzip,
        sizeAvailable: Number.isFinite(minified) && Number.isFinite(gzip)
      };
    } catch (error) {
      console.warn(`Local benchmark metrics unavailable for ${pkg}. Using N/A. ${formatErrorDetails(error)}`);
      return {
        minified: null,
        gzip: null,
        sizeAvailable: false
      };
    }
  })();

  packageSizeCache.set(pkg, task);
  return task;
}

function fetchPackageExportGzipMap(pkg: string): Promise<Map<string, number>> {
  const cached = packageExportGzipCache.get(pkg);
  if (cached) return cached;

  const task = (async () => {
    const payload = await getPackageExportSizes(pkg, { installTimeout: PACKAGE_STATS_INSTALL_TIMEOUT_MS });
    const assets = Array.isArray(payload?.assets) ? payload.assets : [];
    const map = new Map<string, number>();

    for (const asset of assets) {
      if (!asset || typeof asset.name !== 'string' || typeof asset.gzip !== 'number' || !Number.isFinite(asset.gzip)) {
        continue;
      }
      map.set(asset.name, asset.gzip);
    }

    return map;
  })();

  const cachedTask = task.catch((error) => {
    packageExportGzipCache.delete(pkg);
    throw error;
  });

  packageExportGzipCache.set(pkg, cachedTask);
  return cachedTask;
}

async function resolveOverrideGzip(entry: ExportOverheadOverride): Promise<number | null> {
  try {
    const exportMap = await fetchPackageExportGzipMap(entry.package);
    let total = 0;

    for (const exportName of entry.exports) {
      const gzip = exportMap.get(exportName);
      if (typeof gzip !== 'number' || !Number.isFinite(gzip)) return null;
      total += gzip;
    }

    return total;
  } catch (error) {
    console.warn(
      `Local export-size metrics unavailable for ${entry.package} (${entry.exports.join(', ')}). ${formatErrorDetails(error)}`
    );
    return null;
  }
}

async function fetchNpmPublishInfo(pkg: string): Promise<PublishInfo> {
  const metadata = await fetchJson<NpmMetadata>(`${SOURCES.npmRegistry}/${encodeURIComponent(pkg)}`);
  const latest = metadata?.['dist-tags']?.latest;
  const latestManifest = latest ? (metadata?.versions?.[latest] ?? {}) : {};
  const lastPublished = latest ? (metadata?.time?.[latest] ?? null) : null;
  const repositoryUrl = normalizeRepoUrl(latestManifest?.repository ?? metadata?.repository);
  const dependencies =
    latestManifest?.dependencies && typeof latestManifest.dependencies === 'object' ? latestManifest.dependencies : {};
  const peerDependencies =
    latestManifest?.peerDependencies && typeof latestManifest.peerDependencies === 'object'
      ? latestManifest.peerDependencies
      : {};

  return { lastPublished, repositoryUrl, dependencies, peerDependencies };
}

async function fetchPackageMetrics(pkg: string): Promise<PackageMetrics> {
  const publishInfo = await fetchNpmPublishInfo(pkg);
  const sizeMetrics = await fetchPackageSizeMetrics(pkg);
  const dependencyNames = Object.keys(publishInfo.dependencies);
  const peerDependencyNames = Object.keys(publishInfo.peerDependencies);
  const phoneEngineDeps = dependencyNames.filter((dep) => PHONE_ENGINE_PACKAGES.has(dep));
  const phoneEnginePeers = peerDependencyNames.filter((dep) => PHONE_ENGINE_PACKAGES.has(dep));

  return {
    lastPublished: publishInfo.lastPublished ?? null,
    repositoryUrl: publishInfo.repositoryUrl ?? null,
    minified: sizeMetrics.minified,
    gzip: sizeMetrics.gzip,
    sizeAvailable: sizeMetrics.sizeAvailable,
    phoneEngineDeps,
    phoneEnginePeers,
    dataOverheadGzip: null,
    comparableGzip: null
  };
}

async function resolveDataOverheadGzip(
  pkg: string,
  metric: PackageMetrics,
  metrics: Map<string, PackageMetrics>
): Promise<number | null> {
  if (!(metric.sizeAvailable && Number.isFinite(metric.gzip))) return null;
  const overrides = EXPORT_OVERHEAD_OVERRIDES[pkg] ?? [];
  if (metric.phoneEnginePeers.length === 0 && overrides.length === 0) return 0;

  const coveredPeerPkgs = new Set(overrides.map((item) => item.package));
  let total = 0;

  for (const override of overrides) {
    const value = await resolveOverrideGzip(override);
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    total += value;
  }

  for (const peerPkg of metric.phoneEnginePeers) {
    if (coveredPeerPkgs.has(peerPkg)) continue;
    const peerMetric = metrics.get(peerPkg);
    if (
      !(
        peerMetric &&
        peerMetric.sizeAvailable &&
        typeof peerMetric.gzip === 'number' &&
        Number.isFinite(peerMetric.gzip)
      )
    ) {
      return null;
    }
    total += peerMetric.gzip;
  }

  return total;
}

async function fetchMissingPhonePeerMetrics(metrics: Map<string, PackageMetrics>): Promise<void> {
  const missingPeerPkgs = new Set<string>();

  for (const [pkg, metric] of metrics.entries()) {
    for (const peerPkg of metric.phoneEnginePeers) {
      if (!metrics.has(peerPkg)) {
        missingPeerPkgs.add(peerPkg);
      }
    }

    const overrides = EXPORT_OVERHEAD_OVERRIDES[pkg] ?? [];
    for (const override of overrides) {
      if (!metrics.has(override.package)) {
        missingPeerPkgs.add(override.package);
      }
    }
  }

  if (missingPeerPkgs.size === 0) return;

  const fetched: Array<[string, PackageMetrics]> = await mapLimit(
    Array.from(missingPeerPkgs),
    PACKAGE_STATS_CONCURRENCY,
    async (pkg) => [pkg, await fetchPackageMetrics(pkg)]
  );

  for (const [pkg, metric] of fetched) {
    metrics.set(pkg, metric);
  }
}

async function collectMetrics(): Promise<Map<string, PackageMetrics>> {
  const rows = GROUPS.flatMap((group) => group.rows);
  const entries: Array<[string, PackageMetrics]> = await mapLimit(rows, PACKAGE_STATS_CONCURRENCY, async ({ pkg }) => [
    pkg,
    await fetchPackageMetrics(pkg)
  ]);
  const metrics = new Map<string, PackageMetrics>(entries);

  await fetchMissingPhonePeerMetrics(metrics);

  for (const row of rows) {
    const metric = metrics.get(row.pkg);
    if (!metric) continue;
    const overhead = await resolveDataOverheadGzip(row.pkg, metric, metrics);
    metric.dataOverheadGzip = overhead;
    metric.comparableGzip =
      typeof overhead === 'number' &&
      Number.isFinite(overhead) &&
      typeof metric.gzip === 'number' &&
      Number.isFinite(metric.gzip)
        ? metric.gzip + overhead
        : null;
  }

  return metrics;
}

function renderMetricRow(row: GroupRow, metric: PackageMetrics | undefined): string {
  if (!metric) {
    throw new Error(`Missing metrics for ${row.pkg}`);
  }

  const gzipCell = metric.sizeAvailable ? formatKb(metric.gzip) : EMPTY_DATA;
  const dataOverheadCell = Number.isFinite(metric.dataOverheadGzip) ? formatKb(metric.dataOverheadGzip) : EMPTY_DATA;
  const totalGzipCell = Number.isFinite(metric.comparableGzip) ? formatKb(metric.comparableGzip) : EMPTY_DATA;
  const phoneDataSourceCell = renderPhoneDataSource(row.pkg, metric);

  return `| ${markdownPkgWithRepo(row.pkg, row.highlight, metric.repositoryUrl)} | ${formatDate(metric.lastPublished)} | ${phoneDataSourceCell} | ${dataOverheadCell} | ${gzipCell} | ${totalGzipCell} |`;
}

function renderPhoneDataSource(pkg: string, metric: PackageMetrics): string {
  const sourceOverride = PHONE_DATA_SOURCE_LABEL_OVERRIDES[pkg];
  if (sourceOverride) return sourceOverride;

  const overrides = EXPORT_OVERHEAD_OVERRIDES[pkg] ?? [];
  const overrideByPackage = new Map<string, string[]>(overrides.map((entry) => [entry.package, entry.exports]));

  const baseItems = new Set([...metric.phoneEngineDeps, ...metric.phoneEnginePeers]);

  const items = [
    ...metric.phoneEngineDeps.map((depPkg) => `${markdownPkg(depPkg)} (dep)`),
    ...metric.phoneEnginePeers.map((peerPkg) => {
      const exports = overrideByPackage.get(peerPkg);
      if (!exports || exports.length === 0) return `${markdownPkg(peerPkg)} (peer)`;
      return `${markdownPkg(peerPkg)} (peer: ${exports.join(', ')})`;
    }),
    ...overrides
      .filter((entry) => !baseItems.has(entry.package))
      .map((entry) => `${markdownPkg(entry.package)} (runtime: ${entry.exports.join(', ')})`)
  ];

  if (items.length > 0) return items.join(', ');
  return 'Included in package';
}

function sortRowsByTotalGzip(group: GroupDefinition, metrics: Map<string, PackageMetrics>): GroupRow[] {
  return [...group.rows].sort((a, b) => {
    const aMetric = metrics.get(a.pkg);
    const bMetric = metrics.get(b.pkg);
    const aSize =
      aMetric && typeof aMetric.comparableGzip === 'number' && Number.isFinite(aMetric.comparableGzip)
        ? aMetric.comparableGzip
        : Number.POSITIVE_INFINITY;
    const bSize =
      bMetric && typeof bMetric.comparableGzip === 'number' && Number.isFinite(bMetric.comparableGzip)
        ? bMetric.comparableGzip
        : Number.POSITIVE_INFINITY;
    if (aSize !== bSize) return aSize - bSize;
    return a.pkg.localeCompare(b.pkg, 'en');
  });
}

function renderGroupBestLine(group: GroupDefinition, metrics: Map<string, PackageMetrics>): string | null {
  const ranked = sortRowsByTotalGzip(group, metrics);
  const winner = ranked.find((row) => {
    const metric = metrics.get(row.pkg);
    return metric && Number.isFinite(metric.comparableGzip);
  });
  if (!winner) return null;

  const winnerMetric = metrics.get(winner.pkg);
  if (!winnerMetric) return null;

  return `Best choice in ${group.title}: **${winner.pkg}** (${formatKb(winnerMetric.comparableGzip)}).`;
}

function renderGroupSection(group: GroupDefinition, metrics: Map<string, PackageMetrics>): string[] {
  const lines = [
    `#### ${group.title}`,
    '',
    '| Package | Last published | Phone data source | Data overhead | Gzip | Total gzip |',
    '| --- | ---: | --- | ---: | ---: | ---: |'
  ];

  const rows = sortRowsByTotalGzip(group, metrics);
  for (const row of rows) {
    lines.push(renderMetricRow(row, metrics.get(row.pkg)));
  }

  lines.push('');
  const bestLine = renderGroupBestLine(group, metrics);
  if (bestLine) {
    lines.push(bestLine, '');
  }

  if (group.note) {
    lines.push(group.note, '');
  }

  return lines;
}

function renderSection(
  metrics: Map<string, PackageMetrics>,
  snapshotDate = new Date().toISOString().slice(0, 10)
): string {
  const header = [
    BENCHMARK_START_MARKER,
    '### 🪶 Lightest in Class',
    '',
    'Real market comparison, segmented by ecosystem and measured for what developers actually ship.',
    `Snapshot: **${snapshotDate}** ([Benchmark script](${SOURCES.benchmarkScript}), [npm Registry API](${SOURCES.npmRegistry}/${encodeURIComponent('@desource/phone-mask')}), [Bundlephobia package page](${SOURCES.bundlephobiaPackage}${encodeURIComponent('@desource/phone-mask')}) for independent reference).`,
    '',
    '*Use `Total gzip` as the primary comparison column.*',
    '*`Gzip` is measured locally by this repository benchmark pipeline (isolated temp install + minified bundle build).*',
    '*`Data overhead` is additional phone-data gzip excluded from raw package gzip (e.g. required peer engines).*',
    '*`Total gzip` = `Gzip` + `Data overhead`.*',
    ''
  ];
  const groupSections = GROUPS.flatMap((group) => renderGroupSection(group, metrics));
  const lines = [...header, ...groupSections, BENCHMARK_END_MARKER];

  return lines.join('\n').trimEnd();
}

function updateReadmeSection(readme: string, newSection: string): string {
  const markerStartIndex = readme.indexOf(BENCHMARK_START_MARKER);
  const markerEndIndex = readme.indexOf(BENCHMARK_END_MARKER);

  if (markerStartIndex >= 0 && markerEndIndex >= 0 && markerEndIndex > markerStartIndex) {
    const markerEndOffset = markerEndIndex + BENCHMARK_END_MARKER.length;
    return `${readme.slice(0, markerStartIndex)}${newSection}${readme.slice(markerEndOffset)}`;
  }

  throw new Error('Could not locate benchmark section markers in README.md');
}

async function formatMarkdown(markdown: string): Promise<string> {
  const config = (await prettier.resolveConfig(README_FILEPATH)) ?? {};
  return prettier.format(markdown, {
    ...config,
    parser: 'markdown',
    filepath: README_FILEPATH
  });
}

async function main(): Promise<void> {
  const readme = await readFile(README_PATH, 'utf8');

  const metrics = await collectMetrics();
  const section = renderSection(metrics);
  const updated = updateReadmeSection(readme, section);
  const formattedUpdated = await formatMarkdown(updated);

  if (readme === formattedUpdated) {
    console.log('README benchmark section already up to date.');
    return;
  }

  await writeFile(README_PATH, formattedUpdated, 'utf8');
  console.log('Updated README benchmark section.');
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
