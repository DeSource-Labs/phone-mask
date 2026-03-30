import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_OUTPUT = 'coverage-pr-report.md';

const PACKAGE_REPORTS = [
  {
    label: 'phone-mask',
    file: 'packages/phone-mask/coverage/lcov.info',
    packagePath: 'packages/phone-mask/src'
  },
  {
    label: 'phone-mask-vue',
    file: 'packages/phone-mask-vue/coverage/lcov.info',
    packagePath: 'packages/phone-mask-vue/src'
  },
  {
    label: 'phone-mask-react',
    file: 'packages/phone-mask-react/coverage/lcov.info',
    packagePath: 'packages/phone-mask-react/src'
  },
  {
    label: 'phone-mask-svelte',
    file: 'packages/phone-mask-svelte/coverage/lcov.info',
    packagePath: 'packages/phone-mask-svelte/src'
  },
  {
    label: 'phone-mask-nuxt',
    file: 'packages/phone-mask-nuxt/coverage/lcov.info',
    packagePath: 'packages/phone-mask-nuxt/src'
  }
];

/**
 * @param {string} sourceFile
 * @param {string} needle
 * @returns {boolean}
 */
function shouldIncludeSourceFile(sourceFile, needle) {
  if (needle === '') return true;

  const normalized = sourceFile.replaceAll('\\', '/');
  const inMonorepoPath = normalized.includes(needle);
  const inLocalSrcPath = normalized.startsWith('src/') || normalized.includes('/src/');
  return inMonorepoPath || inLocalSrcPath;
}

/**
 * @param {string} line
 * @param {{ lf: number; lh: number; bf: number; bh: number }} counters
 */
function updateLcovCounters(line, counters) {
  if (line.startsWith('LF:')) counters.lf += Number(line.slice(3)) || 0;
  if (line.startsWith('LH:')) counters.lh += Number(line.slice(3)) || 0;
  if (line.startsWith('BRF:')) counters.bf += Number(line.slice(4)) || 0;
  if (line.startsWith('BRH:')) counters.bh += Number(line.slice(4)) || 0;
}

/**
 * Parse LCOV totals and return line/branch coverage summary.
 * If includePath is set, only SF records under package src are counted.
 * Supports monorepo absolute paths and package-local `src/...` paths.
 * @param {string} content
 * @param {string} [includePath]
 */
function parseLcovTotals(content, includePath) {
  const counters = { lf: 0, lh: 0, bf: 0, bh: 0 };
  const needle = includePath ? includePath.replaceAll('\\', '/') : '';
  let includeCurrentRecord = needle === '';

  for (const line of content.split('\n')) {
    if (line.startsWith('SF:')) {
      includeCurrentRecord = shouldIncludeSourceFile(line.slice(3), needle);
      continue;
    }
    if (includeCurrentRecord === false) continue;

    updateLcovCounters(line, counters);
  }

  const linePct = counters.lf === 0 ? 0 : (counters.lh / counters.lf) * 100;
  const branchPct = counters.bf === 0 ? 0 : (counters.bh / counters.bf) * 100;
  return { ...counters, linePct, branchPct };
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
 * @param {string} absoluteLcovPath
 * @param {string} packagePath
 */
function getCoverageRow(absoluteLcovPath, packagePath) {
  if (!fs.existsSync(absoluteLcovPath)) {
    return { lineCell: 'N/A', branchCell: 'N/A', linePct: null };
  }

  const content = fs.readFileSync(absoluteLcovPath, 'utf8');
  const totals = parseLcovTotals(content, packagePath);
  return {
    lineCell: `${totals.lh}/${totals.lf} (${formatPercent(totals.linePct)}%)`,
    branchCell: `${totals.bh}/${totals.bf} (${formatPercent(totals.branchPct)}%)`,
    linePct: totals.linePct
  };
}

/**
 * @param {string} rootDir
 */
function collectCoverageRows(rootDir) {
  const rows = new Map();
  for (const report of PACKAGE_REPORTS) {
    const filePath = path.resolve(rootDir, report.file);
    rows.set(report.label, getCoverageRow(filePath, report.packagePath));
  }
  return rows;
}

/**
 * @param {Map<string, { lineCell: string; branchCell: string; linePct: number | null }>} rows
 */
function hasCoverageData(rows) {
  return Array.from(rows.values()).some((row) => typeof row.linePct === 'number');
}

/**
 * @param {unknown} payload
 * @returns {number | null}
 */
function extractCoverageFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  /**
   * @param {unknown} value
   * @returns {number | null}
   */
  const parseCoverageValue = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  };

  const direct = /** @type {Record<string, unknown>} */ (payload).coverage;
  const directParsed = parseCoverageValue(direct);
  if (directParsed !== null) return directParsed;

  const totals = /** @type {Record<string, unknown>} */ (payload).totals;
  if (totals && typeof totals === 'object') {
    const totalsCoverage = /** @type {Record<string, unknown>} */ (totals).coverage;
    const totalsCoverageParsed = parseCoverageValue(totalsCoverage);
    if (totalsCoverageParsed !== null) return totalsCoverageParsed;

    const totalsCompactCoverage = /** @type {Record<string, unknown>} */ (totals).c;
    const totalsCompactParsed = parseCoverageValue(totalsCompactCoverage);
    if (totalsCompactParsed !== null) return totalsCompactParsed;
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'User-Agent': 'coverage-workflow'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const payload = await res.json();
    return extractCoverageFromPayload(payload);
  } catch {
    return null;
  }
}

/**
 * @param {string} repository
 * @param {string} branch
 * @param {string} token
 * @returns {Promise<{ canFetchCodecov: boolean; coverageByPath: Map<string, number | null>; successfulResponses: number }>}
 */
async function collectCodecovCoverage(repository, branch, token) {
  const canFetchCodecov = Boolean(token && repository);
  const coverageByPath = new Map();
  let successfulResponses = 0;

  if (!canFetchCodecov) {
    return { canFetchCodecov, coverageByPath, successfulResponses };
  }

  await Promise.all(
    PACKAGE_REPORTS.map(async (report) => {
      const coverage = await fetchCodecovMainCoverage(repository, branch, report.packagePath, token);
      if (typeof coverage === 'number') successfulResponses += 1;
      coverageByPath.set(report.packagePath, coverage);
    })
  );

  return { canFetchCodecov, coverageByPath, successfulResponses };
}

/**
 * @param {string[]} lines
 * @param {Map<string, { lineCell: string; branchCell: string; linePct: number | null }>} headRows
 * @param {Map<string, number | null>} baselineByPath
 */
function appendCoverageRows(lines, headRows, baselineByPath) {
  for (const report of PACKAGE_REPORTS) {
    const row = headRows.get(report.label) ?? { lineCell: 'N/A', branchCell: 'N/A', linePct: null };
    const baselineLinePct = baselineByPath.get(report.packagePath) ?? null;
    const baselineCell = typeof baselineLinePct === 'number' ? `${formatPercent(baselineLinePct)}%` : 'N/A';
    const deltaCell =
      typeof baselineLinePct === 'number' && typeof row.linePct === 'number'
        ? formatDelta(row.linePct - baselineLinePct)
        : 'N/A';

    lines.push(`| ${report.label} | ${row.lineCell} | ${row.branchCell} | ${baselineCell} | ${deltaCell} |`);
  }
}

/**
 * @param {Map<string, number | null>} baselineByPath
 * @returns {boolean}
 */
function hasBaselineData(baselineByPath) {
  return Array.from(baselineByPath.values()).some((value) => typeof value === 'number');
}

/**
 * @returns {{
 * outputPath: string;
 * workflow: string;
 * repository: string;
 * runId: string;
 * resolvedRef: string;
 * status: string;
 * codecovToken: string;
 * codecovMainBranch: string;
 * headCoverageRoot: string;
 * baseCoverageRoot: string;
 * baseCoverageRef: string;
 * }}
 */
function getReportConfig() {
  return {
    outputPath: process.env.REPORT_FILE || process.argv[2] || DEFAULT_OUTPUT,
    workflow: process.env.GITHUB_WORKFLOW || 'Coverage',
    repository: process.env.GITHUB_REPOSITORY || '',
    runId: process.env.GITHUB_RUN_ID || '',
    resolvedRef: process.env.RESOLVED_REF || '',
    status: process.env.JOB_STATUS || '',
    codecovToken: process.env.CODECOV_API_TOKEN || '',
    codecovMainBranch: process.env.CODECOV_MAIN_BRANCH || 'main',
    headCoverageRoot: process.env.HEAD_COVERAGE_ROOT || process.cwd(),
    baseCoverageRoot: process.env.BASE_COVERAGE_ROOT || '',
    baseCoverageRef: process.env.BASE_COVERAGE_REF || ''
  };
}

/**
 * @param {string} baseCoverageRoot
 * @param {string} baseCoverageRef
 * @param {string} codecovMainBranch
 * @returns {{ baselineByPath: Map<string, number | null>; baselineSource: string }}
 */
function collectLocalBaseline(baseCoverageRoot, baseCoverageRef, codecovMainBranch) {
  const baselineByPath = new Map();
  const defaultSource = `Codecov (${codecovMainBranch} branch)`;

  if (baseCoverageRoot !== '') {
    const baseRows = collectCoverageRows(baseCoverageRoot);
    if (hasCoverageData(baseRows)) {
      for (const report of PACKAGE_REPORTS) {
        const row = baseRows.get(report.label);
        baselineByPath.set(report.packagePath, row?.linePct ?? null);
      }
      const localSource = baseCoverageRef ? `Local base run (${baseCoverageRef.slice(0, 12)})` : 'Local base run';
      return { baselineByPath, baselineSource: localSource };
    }
  }

  return { baselineByPath, baselineSource: defaultSource };
}

/**
 * @param {{
 * baselineByPath: Map<string, number | null>;
 * repository: string;
 * codecovMainBranch: string;
 * codecovToken: string;
 * }} params
 * @returns {Promise<{ baselineByPath: Map<string, number | null>; codecovCanFetch: boolean; codecovSuccessfulResponses: number }>}
 */
async function ensureBaselineCoverage(params) {
  let codecovCanFetch = false;
  let codecovSuccessfulResponses = 0;

  if (hasBaselineData(params.baselineByPath) === false) {
    const codecov = await collectCodecovCoverage(params.repository, params.codecovMainBranch, params.codecovToken);
    codecovCanFetch = codecov.canFetchCodecov;
    codecovSuccessfulResponses = codecov.successfulResponses;
    for (const [packagePath, value] of codecov.coverageByPath) {
      params.baselineByPath.set(packagePath, value);
    }
  }

  return {
    baselineByPath: params.baselineByPath,
    codecovCanFetch,
    codecovSuccessfulResponses
  };
}

/**
 * @param {{ workflow: string; repository: string; runId: string; resolvedRef: string; baselineSource: string }} params
 * @returns {string[]}
 */
function buildReportHeader(params) {
  return [
    '## Manual Coverage Report',
    '',
    `- Workflow: \`${params.workflow}\``,
    params.repository && params.runId
      ? `- Run: https://github.com/${params.repository}/actions/runs/${params.runId}`
      : '- Run: N/A',
    `- Ref: \`${params.resolvedRef || 'N/A'}\``,
    `- Baseline source: \`${params.baselineSource}\``,
    '',
    '| Package | Lines | Branches | Baseline line | Delta vs baseline |',
    '| --- | ---: | ---: | ---: | ---: |'
  ];
}

/**
 * @param {string} baselineSource
 * @param {boolean} codecovCanFetch
 * @param {number} codecovSuccessfulResponses
 * @returns {string | null}
 */
function getBaselineNote(baselineSource, codecovCanFetch, codecovSuccessfulResponses) {
  if (baselineSource.startsWith('Codecov') === false) return null;
  if (codecovCanFetch === false) {
    return 'ℹ️ Baseline columns are `N/A` because `CODECOV_API_TOKEN` is not configured.';
  }
  if (codecovSuccessfulResponses === 0) {
    return 'ℹ️ Baseline columns are `N/A` because Codecov API data was unavailable for this run.';
  }
  return '';
}

async function main() {
  const config = getReportConfig();
  const headRows = collectCoverageRows(config.headCoverageRoot);
  const localBaseline = collectLocalBaseline(config.baseCoverageRoot, config.baseCoverageRef, config.codecovMainBranch);
  const baselineCoverage = await ensureBaselineCoverage({
    baselineByPath: localBaseline.baselineByPath,
    repository: config.repository,
    codecovMainBranch: config.codecovMainBranch,
    codecovToken: config.codecovToken
  });

  const lines = buildReportHeader({
    workflow: config.workflow,
    repository: config.repository,
    runId: config.runId,
    resolvedRef: config.resolvedRef,
    baselineSource: localBaseline.baselineSource
  });

  appendCoverageRows(lines, headRows, baselineCoverage.baselineByPath);

  const baselineNote = getBaselineNote(
    localBaseline.baselineSource,
    baselineCoverage.codecovCanFetch,
    baselineCoverage.codecovSuccessfulResponses
  );
  if (baselineNote === null || baselineNote === '') {
    lines.push('');
  } else {
    lines.push('', baselineNote, '');
  }

  if (config.status === 'success') {
    lines.push('✅ Unit coverage workflow completed successfully.');
  } else {
    lines.push('❌ Unit coverage workflow failed. See logs in the run link above.');
  }

  fs.writeFileSync(config.outputPath, `${lines.join('\n')}\n`, 'utf8');
}

await main();
