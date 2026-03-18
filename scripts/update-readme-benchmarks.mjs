import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';

const README_PATH = new URL('../README.md', import.meta.url);

const GROUPS = [
  {
    title: 'Core (TypeScript/JavaScript)',
    rows: [
      { pkg: '@desource/phone-mask', repo: 'DeSource-Labs/phone-mask', highlight: true },
      { pkg: 'libphonenumber-js', repo: 'catamphetamine/libphonenumber-js' },
      { pkg: 'google-libphonenumber', repo: 'ruimarinho/google-libphonenumber' },
      { pkg: 'awesome-phonenumber', repo: 'grantila/awesome-phonenumber' }
    ]
  },
  {
    title: 'React',
    rows: [
      { pkg: '@desource/phone-mask-react', repo: 'DeSource-Labs/phone-mask', highlight: true },
      { pkg: 'react-phone-number-input', repo: 'catamphetamine/react-phone-number-input' },
      { pkg: 'react-phone-input-2', repo: 'bl00mber/react-phone-input-2' },
      { pkg: 'react-international-phone', repo: 'ybrusentsov/react-international-phone' },
      { pkg: 'mui-tel-input', repo: 'viclafouch/mui-tel-input' }
    ]
  },
  {
    title: 'Vue',
    rows: [
      { pkg: '@desource/phone-mask-vue', repo: 'DeSource-Labs/phone-mask', highlight: true },
      { pkg: 'vue-tel-input', repo: 'iamstevendao/vue-tel-input' },
      { pkg: 'v-phone-input', repo: 'paul-thebaud/v-phone-input' },
      { pkg: 'vue-phone-number-input', repo: 'LouisMazel/vue-phone-number-input' }
    ]
  },
  {
    title: 'Svelte',
    rows: [
      { pkg: '@desource/phone-mask-svelte', repo: 'DeSource-Labs/phone-mask', highlight: true },
      { pkg: 'svelte-tel-input', repo: 'gyurielf/svelte-tel-input' }
    ]
  },
  {
    title: 'Nuxt',
    rows: [{ pkg: '@desource/phone-mask-nuxt', repo: 'DeSource-Labs/phone-mask', highlight: true }],
    note: 'Nuxt ecosystem note: there are currently no widely adopted Nuxt-only phone input modules with stable npm + Bundlephobia signals comparable to React/Vue/Svelte peers; most Nuxt apps use Vue phone input packages directly.'
  }
];

const SOURCES = {
  npm: 'https://api.npmjs.org/downloads/point/last-month',
  bundlephobia: 'https://bundlephobia.com/api/size?package=',
  github: 'https://api.github.com/repos/'
};

function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString('en-US') : '-';
}

function formatKb(value) {
  return Number.isFinite(value) ? `${(value / 1024).toFixed(1)} KB` : '-';
}

function markdownPkg(name, highlight) {
  const text = highlight ? `**${name}**` : name;
  return `[${text}](https://www.npmjs.com/package/${name})`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, token) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'phone-mask-readme-benchmarks',
          ...(token ? { authorization: `Bearer ${token}` } : {})
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

async function collectMetrics() {
  const token = process.env.GITHUB_TOKEN;
  const rows = GROUPS.flatMap((group) => group.rows);
  const uniqueRepos = [...new Set(rows.map((row) => row.repo).filter(Boolean))];

  const starsByRepo = new Map();
  for (const repo of uniqueRepos) {
    const gh = await fetchJson(`${SOURCES.github}${repo}`, token);
    starsByRepo.set(repo, gh.stargazers_count ?? null);
  }

  const result = new Map();
  for (const row of rows) {
    const [month, bundle] = await Promise.all([
      fetchJson(`${SOURCES.npm}/${encodeURIComponent(row.pkg)}`, token),
      fetchJson(`${SOURCES.bundlephobia}${encodeURIComponent(row.pkg)}`, token)
    ]);

    result.set(row.pkg, {
      monthly: month.downloads,
      min: bundle.size,
      gzip: bundle.gzip,
      stars: starsByRepo.get(row.repo) ?? null
    });
  }

  return result;
}

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
    `Snapshot: **${snapshotDate}** ([Bundlephobia API](${SOURCES.bundlephobia}@desource/phone-mask), [npm Downloads API](${SOURCES.npm}/@desource/phone-mask), [GitHub API](${SOURCES.github}DeSource-Labs/phone-mask)).`,
    ''
  ];

  for (const group of GROUPS) {
    lines.push(`#### ${group.title}`, '');
    lines.push('| Package                            | npm (last month) | GitHub stars | Minified | Gzipped |');
    lines.push('| ---------------------------------- | ----------------: | -----------: | -------: | ------: |');

    for (const row of group.rows) {
      const metric = metrics.get(row.pkg);
      if (!metric) {
        throw new Error(`Missing metrics for ${row.pkg}`);
      }

      lines.push(
        `| ${markdownPkg(row.pkg, row.highlight)} | ${formatNumber(metric.monthly)} | ${formatNumber(metric.stars)} | ${formatKb(metric.min)} | ${formatKb(metric.gzip)} |`
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
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
