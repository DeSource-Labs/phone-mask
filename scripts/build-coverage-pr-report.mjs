import fs from 'node:fs';
import path from 'node:path';

const MARKER = '<!-- coverage-manual-report -->';
const DEFAULT_OUTPUT = 'coverage-pr-report.md';

const PACKAGE_REPORTS = [
  { label: 'phone-mask', file: './packages/phone-mask/coverage/lcov.info', packagePath: 'packages/phone-mask' },
  {
    label: 'phone-mask-vue',
    file: './packages/phone-mask-vue/coverage/lcov.info',
    packagePath: 'packages/phone-mask-vue'
  },
  {
    label: 'phone-mask-react',
    file: './packages/phone-mask-react/coverage/lcov.info',
    packagePath: 'packages/phone-mask-react'
  },
  {
    label: 'phone-mask-svelte',
    file: './packages/phone-mask-svelte/coverage/lcov.info',
    packagePath: 'packages/phone-mask-svelte'
  },
  {
    label: 'phone-mask-nuxt',
    file: './packages/phone-mask-nuxt/coverage/lcov.info',
    packagePath: 'packages/phone-mask-nuxt'
  }
];

/**
 * Parse LCOV totals and return line/branch coverage summary.
 * @param {string} content
 */
function parseLcovTotals(content) {
  let lf = 0;
  let lh = 0;
  let bf = 0;
  let bh = 0;

  for (const line of content.split('\n')) {
    if (line.startsWith('LF:')) lf += Number(line.slice(3)) || 0;
    if (line.startsWith('LH:')) lh += Number(line.slice(3)) || 0;
    if (line.startsWith('BRF:')) bf += Number(line.slice(4)) || 0;
    if (line.startsWith('BRH:')) bh += Number(line.slice(4)) || 0;
  }

  const linePct = lf === 0 ? 0 : (lh / lf) * 100;
  const branchPct = bf === 0 ? 0 : (bh / bf) * 100;

  return { lf, lh, bf, bh, linePct, branchPct };
}

/**
 * @param {number} value
 */
function formatPercent(value) {
  return value.toFixed(2);
}

/**
 * @param {number} value
 */
function formatDelta(value) {
  const normalized = Math.abs(value) < 0.005 ? 0 : value;
  const sign = normalized > 0 ? '+' : '';
  return `${sign}${normalized.toFixed(2)}%`;
}

/**
 * @param {string} filePath
 */
function getCoverageRow(filePath) {
  if (!fs.existsSync(filePath)) {
    return { lineCell: 'N/A', branchCell: 'N/A', linePct: null };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const totals = parseLcovTotals(content);
  return {
    lineCell: `${totals.lh}/${totals.lf} (${formatPercent(totals.linePct)}%)`,
    branchCell: `${totals.bh}/${totals.bf} (${formatPercent(totals.branchPct)}%)`,
    linePct: totals.linePct
  };
}

/**
 * @param {unknown} payload
 * @returns {number | null}
 */
function extractCoverageFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const direct = /** @type {Record<string, unknown>} */ (payload).coverage;
  if (typeof direct === 'number') return direct;

  const totals = /** @type {Record<string, unknown>} */ (payload).totals;
  if (totals && typeof totals === 'object') {
    const totalsCoverage = /** @type {Record<string, unknown>} */ (totals).coverage;
    if (typeof totalsCoverage === 'number') return totalsCoverage;
  }

  const results = /** @type {Record<string, unknown>} */ (payload).results;
  if (Array.isArray(results)) {
    for (const item of results) {
      const nested = extractCoverageFromPayload(item);
      if (nested !== null) return nested;
    }
  }

  return null;
}

/**
 * @param {string} repository
 * @param {string} branch
 * @param {string} packagePath
 * @param {string} token
 * @returns {Promise<number | null>}
 */
async function fetchCodecovMainCoverage(repository, branch, packagePath, token) {
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) return null;

  const url = new URL(
    `https://api.codecov.io/api/v2/github/${encodeURIComponent(owner)}/repos/${encodeURIComponent(repo)}/totals/`
  );
  url.searchParams.set('branch', branch);
  url.searchParams.set('path', packagePath);

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'User-Agent': 'coverage-workflow'
      }
    });

    if (!res.ok) return null;
    const payload = await res.json();
    return extractCoverageFromPayload(payload);
  } catch {
    return null;
  }
}

async function main() {
  const outputPath = process.argv[2] || DEFAULT_OUTPUT;
  const workflow = process.env.GITHUB_WORKFLOW || 'Coverage';
  const repository = process.env.GITHUB_REPOSITORY || '';
  const runId = process.env.GITHUB_RUN_ID || '';
  const resolvedRef = process.env.RESOLVED_REF || '';
  const status = process.env.JOB_STATUS || '';
  const codecovToken = process.env.CODECOV_API_TOKEN || '';
  const codecovMainBranch = process.env.CODECOV_MAIN_BRANCH || 'main';
  const canFetchCodecov = Boolean(codecovToken && repository);

  const codecovCoverageByPath = new Map();
  let codecovSuccessfulResponses = 0;
  if (canFetchCodecov) {
    await Promise.all(
      PACKAGE_REPORTS.map(async (report) => {
        const coverage = await fetchCodecovMainCoverage(
          repository,
          codecovMainBranch,
          report.packagePath,
          codecovToken
        );
        if (typeof coverage === 'number') codecovSuccessfulResponses += 1;
        codecovCoverageByPath.set(report.packagePath, coverage);
      })
    );
  }

  const lines = [
    MARKER,
    '## Manual Coverage Report',
    '',
    `- Workflow: \`${workflow}\``,
    repository && runId ? `- Run: https://github.com/${repository}/actions/runs/${runId}` : '- Run: N/A',
    `- Ref: \`${resolvedRef || 'N/A'}\``,
    `- Main baseline source: \`Codecov (${codecovMainBranch} branch)\``,
    '',
    '| Package | Lines | Branches | Main line (Codecov) | Delta vs main |',
    '| --- | ---: | ---: | ---: | ---: |'
  ];

  for (const report of PACKAGE_REPORTS) {
    const row = getCoverageRow(path.resolve(report.file));
    const mainLineCoverage = canFetchCodecov ? (codecovCoverageByPath.get(report.packagePath) ?? null) : null;
    const mainLineCell = typeof mainLineCoverage === 'number' ? `${formatPercent(mainLineCoverage)}%` : 'N/A';
    let deltaCell = 'N/A';
    if (typeof mainLineCoverage === 'number' && typeof row.linePct === 'number') {
      deltaCell = formatDelta(row.linePct - mainLineCoverage);
    }

    lines.push(`| ${report.label} | ${row.lineCell} | ${row.branchCell} | ${mainLineCell} | ${deltaCell} |`);
  }

  lines.push('');
  if (!canFetchCodecov) {
    lines.push('ℹ️ Main baseline columns are `N/A` because `CODECOV_API_TOKEN` is not configured.');
    lines.push('');
  } else if (codecovSuccessfulResponses === 0) {
    lines.push('ℹ️ Main baseline columns are `N/A` because Codecov API data was unavailable for this run.');
    lines.push('');
  }
  if (status === 'success') {
    lines.push('✅ Unit coverage workflow completed successfully.');
  } else {
    lines.push('❌ Unit coverage workflow failed. See logs in the run link above.');
  }

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

await main();
