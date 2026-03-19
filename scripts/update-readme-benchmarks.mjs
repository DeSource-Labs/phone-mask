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
 * @property {number | null} unpackedSize
 * @property {string | null} repositoryUrl
 */

/**
 * @typedef {object} PackageMetrics
 * @property {number | null} weekly
 * @property {number | null} monthly
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
  npmDownloads: 'https://api.npmjs.org/downloads/point',
  npmRegistry: 'https://registry.npmjs.org',
  bundlephobia: 'https://bundlephobia.com/api/size?package='
};

/**
 * Formats numbers with locale separators and returns '-' for non-finite values.
 * @param {number | null | undefined} value
 * @returns {string}
 */
function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString('en-US') : '-';
}

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
 * Normalizes common repository formats to canonical HTTP(S) URL.
 * @param {string | { url?: string } | null | undefined} repository
 * @returns {string | null}
 */
function normalizeRepoUrl(repository) {
  if (!repository) return null;

  const raw = typeof repository === 'string' ? repository : repository.url;
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  // git+https://github.com/org/repo.git → https://github.com/org/repo
  if (/^git\+https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^git\+/, '').replace(/\.git$/i, '');
  }

  // https://github.com/org/repo.git → https://github.com/org/repo
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\.git$/i, '');
  }

  // git://github.com/org/repo.git → https://github.com/org/repo
  if (/^git:\/\//i.test(trimmed)) {
    return trimmed.replace(/^git:\/\//i, 'https://').replace(/\.git$/i, '');
  }

  // git+ssh://git@github.com:org/repo.git
  // ssh://git@github.com/org/repo.git
  // ssh://git@bitbucket.org:team/repo.git
  if (/^(git\+ssh|ssh):\/\//i.test(trimmed)) {
    let withoutScheme = trimmed.replace(/^(git\+ssh|ssh):\/\//i, '');

    // Drop any "user@" prefix, e.g. "git@"
    const atIndex = withoutScheme.indexOf('@');
    if (atIndex !== -1) {
      withoutScheme = withoutScheme.slice(atIndex + 1);
    }

    // After removing the user, we expect "host[:/]<path>"
    // Replace the first ":" (if present) with "/" to get host/path.
    const colonIndex = withoutScheme.indexOf(':');
    if (colonIndex !== -1) {
      withoutScheme =
        withoutScheme.slice(0, colonIndex) +
        '/' +
        withoutScheme.slice(colonIndex + 1);
    }

    return `https://${withoutScheme}`.replace(/\.git$/i, '');
  }

  // git@github.com:org/repo.git (and similar scp-like syntax)
  const scpLikeMatch = /^([^@]+)@([^:]+):(.+)$/.exec(trimmed);
  if (scpLikeMatch) {
    const host = scpLikeMatch[2];
    const path = scpLikeMatch[3].replace(/\.git$/i, '');
    return `https://${host}/${path}`;
  }

  // owner/repo → https://github.com/owner/repo
  if (/^[\w.-]+\/[\w.-]+$/.test(trimmed)) {
    return `https://github.com/${trimmed}`;
  }

  return null;
}

/**
 * Builds a package markdown link with optional repository link.
 * @param {string} name
 * @param {boolean | undefined} highlight
 * @param {string | null | undefined} repositoryUrl
 * @returns {string}
 */
function markdownPkgWithRepo(name, highlight, repositoryUrl) {
  const pkgLink = markdownPkg(name, highlight);
  if (!repositoryUrl) return pkgLink;
  return `${pkgLink} · [Repo](${repositoryUrl})`;
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
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
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
      if (attempt < 3) {
        await sleep(300 * attempt);
      }
    }
  }

  throw lastError;
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
  const unpackedSize = latest ? (metadata?.versions?.[latest]?.dist?.unpackedSize ?? null) : null;
  const repositoryUrl = normalizeRepoUrl(metadata?.repository);

  return { lastPublished, unpackedSize, repositoryUrl };
}

/**
 * Collects benchmark metrics for all configured packages.
 * @returns {Promise<Map<string, PackageMetrics>>}
 */
async function collectMetrics() {
  const rows = GROUPS.flatMap((group) => group.rows);
  const result = new Map();

  for (const row of rows) {
    const pkg = row.pkg;

    const [week, month, publishInfo, bundle] = await Promise.all([
      fetchJson(`${SOURCES.npmDownloads}/last-week/${encodeURIComponent(pkg)}`),
      fetchJson(`${SOURCES.npmDownloads}/last-month/${encodeURIComponent(pkg)}`),
      fetchNpmPublishInfo(pkg),
      fetchJson(`${SOURCES.bundlephobia}${encodeURIComponent(pkg)}`)
    ]);

    result.set(pkg, {
      weekly: week.downloads ?? null,
      monthly: month.downloads ?? null,
      lastPublished: publishInfo.lastPublished ?? null,
      unpacked: publishInfo.unpackedSize ?? null,
      repositoryUrl: publishInfo.repositoryUrl ?? null,
      minified: bundle.size ?? null,
      gzip: bundle.gzip ?? null
    });
  }

  return result;
}

/**
 * Renders the benchmark section of the README based on collected metrics.
 * @param {Map<string, PackageMetrics>} metrics
 * @param {string} [snapshotDate]
 * @returns {string}
 */
function renderSection(metrics, snapshotDate = getCurrentDateKey()) {

  const lines = [
    BENCHMARK_START_MARKER,
    '### 🪶 Lightest in Class',
    '',
    'Real market comparison, segmented by ecosystem.',
    `Snapshot: **${snapshotDate}** ([Bundlephobia API](${SOURCES.bundlephobia}${encodeURIComponent('@desource/phone-mask')}), [npm Downloads API](${SOURCES.npmDownloads}/last-month/${encodeURIComponent('@desource/phone-mask')}), [npm Registry API](${SOURCES.npmRegistry}/${encodeURIComponent('@desource/phone-mask')})).`,
    ''
  ];

  for (const group of GROUPS) {
    lines.push(
      `#### ${group.title}`,
      '',
      '| Package | Weekly | Monthly | Last published | Minified | Gzipped |',
      '| --- | ---: | ---: | ---: | ---: | ---: |'
    );

    for (const row of group.rows) {
      const metric = metrics.get(row.pkg);
      if (!metric) {
        throw new Error(`Missing metrics for ${row.pkg}`);
      }

      lines.push(
        `| ${markdownPkgWithRepo(row.pkg, row.highlight, metric.repositoryUrl)} | ${formatNumber(metric.weekly)} | ${formatNumber(metric.monthly)} | ${formatDate(metric.lastPublished)} | ${formatKb(metric.minified)} | ${formatKb(metric.gzip)} |`
      );
    }

    lines.push('');

    if (group.note) {
      lines.push(group.note, '');
    }
  }

  lines.push(BENCHMARK_END_MARKER);
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
 * Extracts the benchmark section from README markdown.
 * @param {string} readme
 * @returns {string | null}
 */
function getBenchmarkSection(readme) {
  const markerStartIndex = readme.indexOf(BENCHMARK_START_MARKER);
  const markerEndIndex = readme.indexOf(BENCHMARK_END_MARKER);

  if (markerStartIndex >= 0 && markerEndIndex >= 0 && markerEndIndex > markerStartIndex) {
    const markerEndOffset = markerEndIndex + BENCHMARK_END_MARKER.length;
    return readme.slice(markerStartIndex, markerEndOffset);
  }

  return null;
}

/**
 * Parses the snapshot date from benchmark section.
 * @param {string} readme
 * @returns {string | null}
 */
function parseSnapshotDate(readme) {
  const section = getBenchmarkSection(readme);
  if (!section) return null;

  const snapshotRegex = /Snapshot:\s*\*\*([^*]+)\*\*/;
  const snapshotMatch = snapshotRegex.exec(section);
  if (!snapshotMatch?.[1]) return null;

  const raw = snapshotMatch[1].trim();

  // Prefer ISO format: YYYY-MM-DD
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const isoMatch = isoRegex.exec(raw);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (isValidDateParts(year, month, day)) {
      return toDateKey(year, month, day);
    }
  }

  // Fallback for legacy format: "Month DD, YYYY" (e.g., "March 19, 2026")
  const legacyRegex = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/;
  const legacyMatch = legacyRegex.exec(raw);
  if (legacyMatch) {
    const monthNames = {
      january: 0,
      february: 1,
      march: 2,
      april: 3,
      may: 4,
      june: 5,
      july: 6,
      august: 7,
      september: 8,
      october: 9,
      november: 10,
      december: 11
    };
    const monthName = legacyMatch[1].toLowerCase();
    const monthIndex = Object.hasOwn(monthNames, monthName) ? monthNames[monthName] : -1;
    const day = Number(legacyMatch[2]);
    const year = Number(legacyMatch[3]);

    if (monthIndex >= 0) {
      const month = monthIndex + 1;
      if (isValidDateParts(year, month, day)) {
        return toDateKey(year, month, day);
      }
    }
  }

  return null;
}

/**
 * Converts numeric date parts into canonical YYYY-MM-DD key.
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {string}
 */
function toDateKey(year, month, day) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Validates date parts as a real calendar date.
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {boolean}
 */
function isValidDateParts(year, month, day) {
  const parsed = new Date(year, month - 1, day);
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

/**
 * Returns current local date as YYYY-MM-DD key.
 * @returns {string}
 */
function getCurrentDateKey() {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
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
 * CLI entrypoint for update/check flows.
 * @returns {Promise<void>}
 */
async function main() {
  const checkMode = process.argv.includes('--check');
  const readme = await readFile(README_PATH, 'utf8');
  const formattedReadme = await formatMarkdown(readme);

  if (checkMode) {
    if (readme !== formattedReadme) {
      console.error(
        'README formatting does not match the configured Prettier output. Please format README.md (for example by running: pnpm readme:benchmarks).'
      );
      process.exit(1);
    }

    const snapshotDate = parseSnapshotDate(readme);
    if (!snapshotDate) {
      console.error(
        'Could not find or parse the README benchmark snapshot date. Ensure the "Lightest in Class" section contains a valid snapshot line between the benchmarks markers.'
      );
      process.exit(1);
    }

    const todayKey = getCurrentDateKey();

    if (snapshotDate < todayKey) {
      console.error('README benchmark snapshot is outdated. Run: pnpm readme:benchmarks');
      process.exit(1);
    }

    const metrics = await collectMetrics();
    const section = renderSection(metrics, snapshotDate);
    const updated = updateReadmeSection(readme, section);
    const formattedUpdated = await formatMarkdown(updated);

    if (readme !== formattedUpdated) {
      console.error('README benchmark section is outdated. Run: pnpm readme:benchmarks');
      process.exit(1);
    }

    console.log('README benchmark section is up to date.');
    return;
  }

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
