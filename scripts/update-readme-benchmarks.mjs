import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import prettier from 'prettier';

const README_PATH = new URL('../README.md', import.meta.url);
const README_FILEPATH = fileURLToPath(README_PATH);
const BENCHMARK_START_MARKER = '<!-- benchmarks:start -->';
const BENCHMARK_END_MARKER = '<!-- benchmarks:end -->';

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
 */

/**
 * @typedef {object} PackageMetrics
 * @property {string | null} lastPublished
 * @property {number | null} unpacked
 * @property {string | null} repositoryUrl
 * @property {number | null} minified
 * @property {number | null} gzip
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
    ]
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
  bundlephobia: 'https://bundlephobia.com/api/size?package='
};
const MAX_FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Formats byte values as kilobytes and returns '-' for non-finite values.
 * @param {number | null | undefined} value
 * @returns {string}
 */
function formatKb(value) {
  return Number.isFinite(value) ? `${(value / 1024).toFixed(1)} KB` : '-';
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
 * @param {string} url
 * @returns {string}
 */
function markdownRepo(url) {
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

/**
 * Reads publish metadata for a package from npm registry.
 * @param {string} pkg
 * @returns {Promise<PublishInfo>}
 */
async function fetchNpmPublishInfo(pkg) {
  const metadata = await fetchJson(`${SOURCES.npmRegistry}/${encodeURIComponent(pkg)}`);
  const latest = metadata?.['dist-tags']?.latest;
  const lastPublished = latest ? (metadata?.time?.[latest] ?? null) : null;
  const repositoryUrl = normalizeRepoUrl(metadata?.repository);

  return { lastPublished, repositoryUrl };
}

/**
 * Fetches combined benchmark metrics for a package.
 * @param {string} pkg
 * @returns {Promise<PackageMetrics>}
 */
async function fetchPackageMetrics(pkg) {
  const encoded = encodeURIComponent(pkg);
  const [publishInfo, bundle] = await Promise.all([
    fetchNpmPublishInfo(pkg),
    fetchJson(`${SOURCES.bundlephobia}${encoded}`)
  ]);

  return {
    lastPublished: publishInfo.lastPublished ?? null,
    repositoryUrl: publishInfo.repositoryUrl ?? null,
    minified: bundle.size ?? null,
    gzip: bundle.gzip ?? null
  };
}

/**
 * Collects benchmark metrics for all configured packages.
 * @returns {Promise<Map<string, PackageMetrics>>}
 */
async function collectMetrics() {
  const rows = GROUPS.flatMap((group) => group.rows);
  const entries = await Promise.all(rows.map(async ({ pkg }) => [pkg, await fetchPackageMetrics(pkg)]));
  return new Map(entries);
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

  return `| ${markdownPkg(row.pkg, row.highlight)} | ${markdownRepo(metric.repositoryUrl)} | ${formatDate(metric.lastPublished)} | ${formatKb(metric.minified)} | ${formatKb(metric.gzip)} |`;
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
    '| Package | | Last published | Minified | Gzipped |',
    '| --- | ---: | ---: | ---: | ---: |'
  ];

  for (const row of group.rows) {
    lines.push(renderMetricRow(row, metrics.get(row.pkg)));
  }

  lines.push('');
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
    'Real market comparison, segmented by ecosystem.',
    `Snapshot: **${snapshotDate}** ([Bundlephobia API](${SOURCES.bundlephobia}${encodeURIComponent('@desource/phone-mask')}), [npm Registry API](${SOURCES.npmRegistry}/${encodeURIComponent('@desource/phone-mask')})).`,
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
