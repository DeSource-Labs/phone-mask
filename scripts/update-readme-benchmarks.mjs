import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import prettier from 'prettier';

const README_PATH = new URL('../README.md', import.meta.url);
const README_FILEPATH = fileURLToPath(README_PATH);
const BENCHMARK_START_MARKER = '<!-- benchmarks:start -->';
const BENCHMARK_END_MARKER = '<!-- benchmarks:end -->';
const EMPTY_DATA = 'N/A';

/**
 * @typedef {object} GroupRow
 * @property {string} pkg
 * @property {boolean} [highlight]
 */

/**
 * @typedef {object} GroupDefinition
 * @property {string} title
 * @property {GroupRow[]} rows
 * @property {string} [note]
 */

/**
 * @typedef {object} PublishInfo
 * @property {string | null} lastPublished
 * @property {string | null} repositoryUrl
 * @property {Record<string, string>} dependencies
 * @property {Record<string, string>} peerDependencies
 */

/**
 * @typedef {object} PackageMetrics
 * @property {string | null} lastPublished
 * @property {string | null} repositoryUrl
 * @property {number | null} minified
 * @property {number | null} gzip
 * @property {boolean} bundlephobiaAvailable
 * @property {string[]} phoneEngineDeps
 * @property {string[]} phoneEnginePeers
 * @property {number | null} dataOverheadGzip
 * @property {number | null} comparableGzip
 */

/** @type {GroupDefinition[]} */
const GROUPS = [
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
    note: 'Nuxt ecosystem note: there are currently no widely adopted Nuxt-only phone input modules with stable npm + Bundlephobia signals comparable to React/Vue/Svelte peers; most Nuxt apps use Vue phone input packages directly.'
  }
];

const SOURCES = {
  npmRegistry: 'https://registry.npmjs.org',
  bundlephobia: 'https://bundlephobia.com/api/size?package=',
  bundlephobiaExports: 'https://bundlephobia.com/api/exports-sizes?package='
};
const MAX_FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 10_000;
const PHONE_ENGINE_PACKAGES = new Set([
  '@desource/phone-mask',
  'libphonenumber-js',
  'google-libphonenumber',
  'awesome-phonenumber'
]);

/** @type {Record<string, string>} */
const PHONE_DATA_SOURCE_LABEL_OVERRIDES = {
  'react-international-phone': 'None'
};

/**
 * Explicit per-package overhead overrides, using Bundlephobia export-level sizes.
 * This is used when a package loads specific symbols from dependencies/peers indirectly
 * and raw package gzip under-reports effective runtime payload.
 * @type {Record<string, Array<{ package: string, exports: string[] }>>}
 */
const EXPORT_OVERHEAD_OVERRIDES = {
  'vue-tel-input': [{ package: 'libphonenumber-js', exports: ['parsePhoneNumberFromString'] }],
  '@desource/phone-mask-nuxt': [{ package: '@desource/phone-mask-vue', exports: ['install'] }]
};

/**
 * Formats byte values as kilobytes and returns '-' for non-finite values.
 * @param {number | null | undefined} value
 * @returns {string}
 */
function formatKb(value) {
  return Number.isFinite(value) ? `${(value / 1024).toFixed(1)} KB` : EMPTY_DATA;
}

/**
 * Formats date-like input as YYYY-MM-DD and returns '-' for invalid/missing values.
 * @param {string | Date | null | undefined} value
 * @returns {string}
 */
function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().slice(0, 10);
}

/**
 * Builds an npm package markdown link.
 * @param {string} name
 * @param {boolean | undefined} highlight
 * @returns {string}
 */
function markdownPkg(name, highlight) {
  const text = highlight ? `**${name}**` : name;
  return `[${text}](https://www.npmjs.com/package/${name})`;
}

/**
 * Builds package cell content with npm + optional repo link.
 * @param {string} name
 * @param {boolean | undefined} highlight
 * @param {string | null} repositoryUrl
 * @returns {string}
 */
function markdownPkgWithRepo(name, highlight, repositoryUrl) {
  const pkgLink = markdownPkg(name, highlight);
  const repoLink = markdownRepo(repositoryUrl);
  if (repoLink === '-') return pkgLink;
  return `${pkgLink} · ${repoLink}`;
}

/**
 * Removes trailing ".git" suffix from repository URLs.
 * @param {string} value
 * @returns {string}
 */
function stripGitSuffix(value) {
  return value.replace(/\.git$/i, '');
}

/**
 * Extracts and trims raw repository value from package metadata.
 * @param {string | { url?: string } | null | undefined} repository
 * @returns {string | null}
 */
function getRawRepositoryValue(repository) {
  if (!repository) return null;
  const raw = typeof repository === 'string' ? repository : repository.url;
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

/**
 * Parses direct URL-like repository forms.
 * @param {string} value
 * @returns {string | null}
 */
function parseDirectRepositoryUrl(value) {
  const transforms = [
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

/**
 * Parses ssh/git+ssh repository formats to canonical HTTP(S) candidate.
 * @param {string} value
 * @returns {string | null}
 */
function parseSshRepositoryUrl(value) {
  if (!/^(git\+ssh|ssh):\/\//i.test(value)) return null;

  const withoutScheme = value.replace(/^(git\+ssh|ssh):\/\//i, '');
  const withoutUser = withoutScheme.includes('@') ? withoutScheme.slice(withoutScheme.indexOf('@') + 1) : withoutScheme;
  const hostAndPath = withoutUser.replace(':', '/');
  return stripGitSuffix(`https://${hostAndPath}`);
}

/**
 * Parses SCP-like repository forms to canonical HTTP(S) candidate.
 * @param {string} value
 * @returns {string | null}
 */
function parseScpRepositoryUrl(value) {
  const scpLikeMatch = /^([^@]+)@([^:]+):(.+)$/.exec(value);
  if (!scpLikeMatch) return null;
  return stripGitSuffix(`https://${scpLikeMatch[2]}/${scpLikeMatch[3]}`);
}

/**
 * Parses owner/repo shorthand to canonical GitHub URL candidate.
 * @param {string} value
 * @returns {string | null}
 */
function parseOwnerRepoShorthand(value) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(value)) return null;
  return `https://github.com/${value}`;
}

/**
 * Validates and normalizes HTTP(S) candidate URL.
 * @param {string | null} candidate
 * @returns {string | null}
 */
function validateHttpRepositoryUrl(candidate) {
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

/**
 * Normalizes common repository formats to canonical HTTP(S) URL.
 * @param {string | { url?: string } | null | undefined} repository
 * @returns {string | null}
 */
function normalizeRepoUrl(repository) {
  const rawValue = getRawRepositoryValue(repository);
  if (!rawValue) return null;

  const candidate =
    parseDirectRepositoryUrl(rawValue) ??
    parseSshRepositoryUrl(rawValue) ??
    parseScpRepositoryUrl(rawValue) ??
    parseOwnerRepoShorthand(rawValue);

  return validateHttpRepositoryUrl(candidate);
}

/**
 * Builds a markdown link for a repository URL, escaping parentheses to avoid markdown parsing issues.
 * @param {string | null} url
 * @returns {string}
 */
function markdownRepo(url) {
  if (!url) return '-';
  const safeUrl = url.replaceAll('(', '%28').replaceAll(')', '%29');
  return `[Repo](${safeUrl})`;
}

/**
 * Delays execution for retry backoff.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches JSON with retries.
 * @param {string} url
 * @returns {Promise<any>}
 */
async function fetchJson(url) {
  /** @type {unknown} */
  let lastError = null;

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

      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_FETCH_ATTEMPTS) {
        await sleep(300 * attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch JSON from ${url}`);
}

/** @type {Map<string, Promise<Map<string, number>>>} */
const bundlephobiaExportsCache = new Map();

/**
 * Fetches Bundlephobia export-level gzip sizes and caches results.
 * @param {string} pkg
 * @returns {Promise<Map<string, number>>}
 */
function fetchBundlephobiaExportGzipMap(pkg) {
  const cached = bundlephobiaExportsCache.get(pkg);
  if (cached) return cached;

  const task = (async () => {
    const encoded = encodeURIComponent(pkg);
    const payload = await fetchJson(`${SOURCES.bundlephobiaExports}${encoded}`);
    const assets = Array.isArray(payload?.assets) ? payload.assets : [];
    const map = new Map();

    for (const asset of assets) {
      if (!asset || typeof asset.name !== 'string' || !Number.isFinite(asset.gzip)) continue;
      map.set(asset.name, asset.gzip);
    }

    return map;
  })();

  bundlephobiaExportsCache.set(pkg, task);
  return task;
}

/**
 * Resolves gzip overhead for an override entry using exact export sizes.
 * @param {{ package: string, exports: string[] }} entry
 * @returns {Promise<number | null>}
 */
async function resolveOverrideGzip(entry) {
  try {
    const exportMap = await fetchBundlephobiaExportGzipMap(entry.package);
    let total = 0;

    for (const exportName of entry.exports) {
      const gzip = exportMap.get(exportName);
      if (!Number.isFinite(gzip)) return null;
      total += gzip;
    }

    return total;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `Bundlephobia export-size metrics unavailable for ${entry.package} (${entry.exports.join(', ')}). (${message})`
    );
    return null;
  }
}

/**
 * Reads publish metadata for a package from npm registry.
 * @param {string} pkg
 * @returns {Promise<PublishInfo>}
 */
async function fetchNpmPublishInfo(pkg) {
  const metadata = await fetchJson(`${SOURCES.npmRegistry}/${encodeURIComponent(pkg)}`);
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

/**
 * Fetches combined benchmark metrics for a package.
 * @param {string} pkg
 * @returns {Promise<PackageMetrics>}
 */
async function fetchPackageMetrics(pkg) {
  const encoded = encodeURIComponent(pkg);
  const publishInfo = await fetchNpmPublishInfo(pkg);
  const dependencyNames = Object.keys(publishInfo.dependencies);
  const peerDependencyNames = Object.keys(publishInfo.peerDependencies);
  const phoneEngineDeps = dependencyNames.filter((dep) => PHONE_ENGINE_PACKAGES.has(dep));
  const phoneEnginePeers = peerDependencyNames.filter((dep) => PHONE_ENGINE_PACKAGES.has(dep));

  /** @type {number | null} */
  let minified = null;
  /** @type {number | null} */
  let gzip = null;
  let bundlephobiaAvailable = true;

  try {
    const bundle = await fetchJson(`${SOURCES.bundlephobia}${encoded}`);
    minified = bundle.size ?? null;
    gzip = bundle.gzip ?? null;
  } catch (error) {
    bundlephobiaAvailable = false;
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Bundlephobia metrics unavailable for ${pkg}. Using N/A. (${message})`);
  }

  return {
    lastPublished: publishInfo.lastPublished ?? null,
    repositoryUrl: publishInfo.repositoryUrl ?? null,
    minified,
    gzip,
    bundlephobiaAvailable,
    phoneEngineDeps,
    phoneEnginePeers,
    dataOverheadGzip: null,
    comparableGzip: null
  };
}

/**
 * Resolves phone-data gzip overhead excluded from package raw Bundlephobia gzip.
 * For known lazy peer-import patterns, uses exact export-level gzip sizes.
 * Otherwise falls back to full peer package gzip.
 * @param {string} pkg
 * @param {PackageMetrics} metric
 * @param {Map<string, PackageMetrics>} metrics
 * @returns {Promise<number | null>}
 */
async function resolveDataOverheadGzip(pkg, metric, metrics) {
  if (!metric.bundlephobiaAvailable || !Number.isFinite(metric.gzip)) return null;
  const overrides = EXPORT_OVERHEAD_OVERRIDES[pkg] ?? [];
  if (metric.phoneEnginePeers.length === 0 && overrides.length === 0) return 0;

  const coveredPeerPkgs = new Set(overrides.map((item) => item.package));
  let total = 0;

  for (const override of overrides) {
    const value = await resolveOverrideGzip(override);
    if (!Number.isFinite(value)) return null;
    total += value;
  }

  for (const peerPkg of metric.phoneEnginePeers) {
    if (coveredPeerPkgs.has(peerPkg)) continue;
    const peerMetric = metrics.get(peerPkg);
    if (!peerMetric || !peerMetric.bundlephobiaAvailable || !Number.isFinite(peerMetric.gzip)) {
      return null;
    }
    total += peerMetric.gzip;
  }

  return total;
}

/**
 * Ensures all phone-engine peer packages have metrics so comparable gzip can be computed.
 * @param {Map<string, PackageMetrics>} metrics
 * @returns {Promise<void>}
 */
async function fetchMissingPhonePeerMetrics(metrics) {
  const missingPeerPkgs = new Set();

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

  const fetched = await Promise.all(
    Array.from(missingPeerPkgs, async (pkg) => [pkg, await fetchPackageMetrics(pkg)])
  );

  for (const [pkg, metric] of fetched) {
    metrics.set(pkg, metric);
  }
}

/**
 * Collects benchmark metrics for all configured packages.
 * @returns {Promise<Map<string, PackageMetrics>>}
 */
async function collectMetrics() {
  const rows = GROUPS.flatMap((group) => group.rows);
  const entries = await Promise.all(rows.map(async ({ pkg }) => [pkg, await fetchPackageMetrics(pkg)]));
  const metrics = new Map(entries);

  await fetchMissingPhonePeerMetrics(metrics);

  for (const row of rows) {
    const metric = metrics.get(row.pkg);
    if (!metric) continue;
    const overhead = await resolveDataOverheadGzip(row.pkg, metric, metrics);
    metric.dataOverheadGzip = overhead;
    metric.comparableGzip = Number.isFinite(overhead) && Number.isFinite(metric.gzip) ? metric.gzip + overhead : null;
  }

  return metrics;
}

/**
 * Renders markdown row for a package metric.
 * @param {GroupRow} row
 * @param {PackageMetrics | undefined} metric
 * @returns {string}
 */
function renderMetricRow(row, metric) {
  if (!metric) {
    throw new Error(`Missing metrics for ${row.pkg}`);
  }

  const gzipCell = metric.bundlephobiaAvailable ? formatKb(metric.gzip) : EMPTY_DATA;
  const dataOverheadCell = Number.isFinite(metric.dataOverheadGzip) ? formatKb(metric.dataOverheadGzip) : EMPTY_DATA;
  const totalGzipCell = Number.isFinite(metric.comparableGzip) ? formatKb(metric.comparableGzip) : EMPTY_DATA;
  const phoneDataSourceCell = renderPhoneDataSource(row.pkg, metric);

  return `| ${markdownPkgWithRepo(row.pkg, row.highlight, metric.repositoryUrl)} | ${formatDate(metric.lastPublished)} | ${phoneDataSourceCell} | ${dataOverheadCell} | ${gzipCell} | ${totalGzipCell} |`;
}

/**
 * Renders phone data source cell from dependency model.
 * @param {string} pkg
 * @param {PackageMetrics} metric
 * @returns {string}
 */
function renderPhoneDataSource(pkg, metric) {
  const sourceOverride = PHONE_DATA_SOURCE_LABEL_OVERRIDES[pkg];
  if (sourceOverride) return sourceOverride;

  const overrides = EXPORT_OVERHEAD_OVERRIDES[pkg] ?? [];
  const overrideByPackage = new Map(overrides.map((entry) => [entry.package, entry.exports]));

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

/**
 * Returns group rows sorted by total gzip ascending (N/A values are placed last).
 * @param {GroupDefinition} group
 * @param {Map<string, PackageMetrics>} metrics
 * @returns {GroupRow[]}
 */
function sortRowsByTotalGzip(group, metrics) {
  return [...group.rows].sort((a, b) => {
    const aMetric = metrics.get(a.pkg);
    const bMetric = metrics.get(b.pkg);
    const aSize = aMetric && Number.isFinite(aMetric.comparableGzip) ? aMetric.comparableGzip : Number.POSITIVE_INFINITY;
    const bSize = bMetric && Number.isFinite(bMetric.comparableGzip) ? bMetric.comparableGzip : Number.POSITIVE_INFINITY;
    if (aSize !== bSize) return aSize - bSize;
    return a.pkg.localeCompare(b.pkg, 'en');
  });
}

/**
 * Renders short "best total gzip" summary line for a group.
 * @param {GroupDefinition} group
 * @param {Map<string, PackageMetrics>} metrics
 * @returns {string | null}
 */
function renderGroupBestLine(group, metrics) {
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

/**
 * Renders markdown lines for a package group table.
 * @param {GroupDefinition} group
 * @param {Map<string, PackageMetrics>} metrics
 * @returns {string[]}
 */
function renderGroupSection(group, metrics) {
  const lines = [
    `#### ${group.title}`,
    '',
    '| Package | Last published | Phone data source | Data overhead** | Gzip* | Total gzip* |',
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

/**
 * Renders the benchmark section of the README based on collected metrics.
 * @param {Map<string, PackageMetrics>} metrics
 * @param {string} [snapshotDate]
 * @returns {string}
 */
function renderSection(metrics, snapshotDate = new Date().toISOString().slice(0, 10)) {
  const header = [
    BENCHMARK_START_MARKER,
    '### 🪶 Lightest in Class',
    '',
    'Real market comparison, segmented by ecosystem and measured for what developers actually ship.',
    `Snapshot: **${snapshotDate}** ([Bundlephobia API](${SOURCES.bundlephobia}${encodeURIComponent('@desource/phone-mask')}), [Bundlephobia Exports API](${SOURCES.bundlephobiaExports}${encodeURIComponent('libphonenumber-js')}), [npm Registry API](${SOURCES.npmRegistry}/${encodeURIComponent('@desource/phone-mask')})).`,
    '',
    '*Use `Total gzip` as the primary comparison column.*',
    '*`Gzip` is Bundlephobia raw package gzip.*',
    '*`Data overhead` is additional phone-data gzip excluded from raw package gzip (e.g. required peer engines). When available, export-level Bundlephobia sizes are used for better precision.*',
    '*`Total gzip` = `Gzip` + `Data overhead`.*',
    ''
  ];
  const groupSections = GROUPS.flatMap((group) => renderGroupSection(group, metrics));
  const lines = [...header, ...groupSections, BENCHMARK_END_MARKER];

  return lines.join('\n').trimEnd();
}

/**
 * Replaces only the benchmark section inside README markdown.
 * @param {string} readme
 * @param {string} newSection
 * @returns {string}
 */
function updateReadmeSection(readme, newSection) {
  const markerStartIndex = readme.indexOf(BENCHMARK_START_MARKER);
  const markerEndIndex = readme.indexOf(BENCHMARK_END_MARKER);

  if (markerStartIndex >= 0 && markerEndIndex >= 0 && markerEndIndex > markerStartIndex) {
    const markerEndOffset = markerEndIndex + BENCHMARK_END_MARKER.length;
    return `${readme.slice(0, markerStartIndex)}${newSection}${readme.slice(markerEndOffset)}`;
  }

  throw new Error('Could not locate benchmark section markers in README.md');
}

/**
 * Formats markdown content using repository Prettier configuration.
 * @param {string} markdown
 * @returns {Promise<string>}
 */
async function formatMarkdown(markdown) {
  const config = (await prettier.resolveConfig(README_FILEPATH)) ?? {};
  return prettier.format(markdown, {
    ...config,
    parser: 'markdown',
    filepath: README_FILEPATH
  });
}

/**
 * CLI entrypoint for benchmark section generation.
 * @returns {Promise<void>}
 */
async function main() {
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
