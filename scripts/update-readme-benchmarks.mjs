import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';

const README_PATH = new URL('../README.md', import.meta.url);

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

function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString('en-US') : '-';
}

function formatKb(value) {
  return Number.isFinite(value) ? `${(value / 1024).toFixed(1)} KB` : '-';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().slice(0, 10);
}

function markdownPkg(name, highlight) {
  const text = highlight ? `**${name}**` : name;
  return `[${text}](https://www.npmjs.com/package/${name})`;
}

function normalizeRepoUrl(repository) {
  if (!repository) return null;

  const raw = typeof repository === 'string' ? repository : repository.url;
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^git\+https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^git\+/, '').replace(/\.git$/i, '');
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\.git$/i, '');
  }

  if (/^git:\/\//i.test(trimmed)) {
    return trimmed.replace(/^git:\/\//i, 'https://').replace(/\.git$/i, '');
  }

  if (/^[\w.-]+\/[\w.-]+$/.test(trimmed)) {
    return `https://github.com/${trimmed}`;
  }

  return null;
}

function markdownPkgWithRepo(name, highlight, repositoryUrl) {
  const pkgLink = markdownPkg(name, highlight);
  if (!repositoryUrl) return pkgLink;
  return `${pkgLink} · [Repo](${repositoryUrl})`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
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

async function fetchNpmPublishedDate(pkg) {
  const metadata = await fetchJson(`${SOURCES.npmRegistry}/${encodeURIComponent(pkg)}`);
  const latest = metadata?.['dist-tags']?.latest;
  const lastPublished = latest ? metadata?.time?.[latest] ?? null : null;
  const unpackedSize = latest ? metadata?.versions?.[latest]?.dist?.unpackedSize ?? null : null;
  const repositoryUrl = normalizeRepoUrl(metadata?.repository);

  return { lastPublished, unpackedSize, repositoryUrl };
}

async function fetchOrNull(loader) {
  try {
    return await loader();
  } catch {
    return null;
  }
}

async function collectMetrics() {
  const rows = GROUPS.flatMap((group) => group.rows);
  const result = new Map();

  for (const row of rows) {
    const pkg = row.pkg;

    const [week, month, publishInfo, bundle] = await Promise.all([
      fetchOrNull(() => fetchJson(`${SOURCES.npmDownloads}/last-week/${encodeURIComponent(pkg)}`)),
      fetchOrNull(() => fetchJson(`${SOURCES.npmDownloads}/last-month/${encodeURIComponent(pkg)}`)),
      fetchOrNull(() => fetchNpmPublishedDate(pkg)),
      fetchOrNull(() => fetchJson(`${SOURCES.bundlephobia}${encodeURIComponent(pkg)}`))
    ]);

    result.set(pkg, {
      weekly: week?.downloads ?? null,
      monthly: month?.downloads ?? null,
      lastPublished: publishInfo?.lastPublished ?? null,
      unpacked: publishInfo?.unpackedSize ?? null,
      repositoryUrl: publishInfo?.repositoryUrl ?? null,
      minified: bundle?.size ?? null,
      gzip: bundle?.gzip ?? null
    });
  }

  return result;
}

/**
 * Renders the benchmark section of the README based on collected metrics.
 * @param {Map<string, {weekly: number|null, monthly: number|null, lastPublished: string|null, unpacked: number|null, repositoryUrl: string|null, minified: number|null, gzip: number|null}>} metrics
 * @returns {string}
 */
function renderSection(metrics) {
  const snapshotDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const lines = [
    '### 🪶 Lightest in Class',
    '',
    'Real market comparison, segmented by ecosystem.',
    `Snapshot: **${snapshotDate}** ([Bundlephobia API](${SOURCES.bundlephobia}@desource/phone-mask), [npm Downloads API](${SOURCES.npmDownloads}/last-month/@desource/phone-mask), [npm Registry API](${SOURCES.npmRegistry}/@desource/phone-mask)).`,
    ''
  ];

  for (const group of GROUPS) {
    lines.push(`#### ${group.title}`, '');
    lines.push('| Package | Weekly | Monthly | Last published | Minified | Gzipped |');
    lines.push('| --- | ---: | ---: | ---: | ---: | ---: |');

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

  return lines.join('\n').trimEnd();
}

function updateReadmeSection(readme, newSection) {
  const sectionPattern = /### 🪶 Lightest in Class[\s\S]*?(?=\n### 🎨 Framework-Ready)/;
  if (!sectionPattern.test(readme)) {
    throw new Error('Could not locate "Lightest in Class" section in README.md');
  }

  return readme.replace(sectionPattern, newSection);
}

async function main() {
  const checkMode = process.argv.includes('--check');
  const metrics = await collectMetrics();
  const section = renderSection(metrics);
  const readme = await readFile(README_PATH, 'utf8');
  const updated = updateReadmeSection(readme, section);

  if (checkMode) {
    if (readme !== updated) {
      console.error('README benchmark section is outdated. Run: pnpm readme:benchmarks');
      process.exit(1);
    }
    console.log('README benchmark section is up to date.');
    return;
  }

  if (readme === updated) {
    console.log('README benchmark section already up to date.');
    return;
  }

  await writeFile(README_PATH, updated, 'utf8');
  console.log('Updated README benchmark section.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
