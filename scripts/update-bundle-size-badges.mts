import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import prettier from 'prettier';
import { getPackageExportSizes, getPackageStats, type PackageStatsPayload } from './stable-package-stats.mts';
import { EXPORT_OVERHEAD_OVERRIDES, isFiniteBenchmarkNumber } from './readme-benchmark-shared.mts';

type PackageDefinition = {
  key: 'core' | 'react' | 'vue' | 'svelte' | 'nuxt';
  name: string;
  badge: string;
};

type SizeMetric = {
  minified: number;
  gzip: number;
};

type PackageMeasurement = PackageDefinition & SizeMetric;

const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url));
const COMPARISON_PATH = path.join(ROOT_DIR, 'docs', 'comparison.md');
const BADGES_DIR = path.join(ROOT_DIR, '.github', 'badges');
const DEMO_SIZES_PATH = path.join(ROOT_DIR, 'demo', 'shared', 'generated', 'bundle-sizes.ts');
const PACKAGE_SIZE_START_MARKER = '<!-- package-sizes:start -->';
const PACKAGE_SIZE_END_MARKER = '<!-- package-sizes:end -->';
const INSTALL_TIMEOUT_MS = 120_000;
const execFileAsync = promisify(execFile);

const PACKAGES: PackageDefinition[] = [
  { key: 'core', name: '@desource/phone-mask', badge: 'phone-mask.svg' },
  { key: 'react', name: '@desource/phone-mask-react', badge: 'phone-mask-react.svg' },
  { key: 'vue', name: '@desource/phone-mask-vue', badge: 'phone-mask-vue.svg' },
  { key: 'svelte', name: '@desource/phone-mask-svelte', badge: 'phone-mask-svelte.svg' },
  { key: 'nuxt', name: '@desource/phone-mask-nuxt', badge: 'phone-mask-nuxt.svg' }
];

function requireSize(payload: PackageStatsPayload, label: string): SizeMetric {
  if (!isFiniteBenchmarkNumber(payload.size) || !isFiniteBenchmarkNumber(payload.gzip)) {
    throw new Error(`Bundle measurement for ${label} did not return minified and gzip sizes`);
  }

  return { minified: payload.size, gzip: payload.gzip };
}

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    };
    return entities[character] ?? character;
  });
}

function renderBadge(gzip: number): string {
  const label = 'gzip';
  const value = formatKb(gzip).replace('KB', 'kB');
  const accessibleLabel = `${label}: ${value}`;

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="106" height="20" role="img"',
    `  aria-label="${escapeXml(accessibleLabel)}">`,
    `  <title>${escapeXml(accessibleLabel)}</title>`,
    '  <defs>',
    '    <linearGradient id="s" x2="0" y2="100%">',
    '      <stop offset="0" stop-color="#fff" stop-opacity=".15"/>',
    '      <stop offset="1" stop-opacity=".1"/>',
    '    </linearGradient>',
    '    <clipPath id="r">',
    '      <rect width="106" height="20" rx="3"/>',
    '    </clipPath>',
    '  </defs>',
    '  <g clip-path="url(#r)">',
    '    <rect width="42" height="20" fill="#555"/>',
    '    <rect x="42" width="64" height="20" fill="#7c3aed"/>',
    '    <rect width="106" height="20" fill="url(#s)"/>',
    '  </g>',
    '  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif"',
    '    font-size="11">',
    '    <text x="21" y="15" fill="#010101" fill-opacity=".3">gzip</text>',
    '    <text x="21" y="14">gzip</text>',
    `    <text x="74" y="15" fill="#010101" fill-opacity=".3">${escapeXml(value)}</text>`,
    `    <text x="74" y="14">${escapeXml(value)}</text>`,
    '  </g>',
    '</svg>',
    ''
  ].join('\n');
}

async function buildPackages(): Promise<void> {
  console.info('Building workspace packages...');
  await execFileAsync('pnpm', ['build'], {
    cwd: ROOT_DIR,
    maxBuffer: 20 * 1024 * 1024
  });
}

async function packPackage(definition: PackageDefinition, destination: string): Promise<string> {
  const before = new Set(await readdir(destination));
  await execFileAsync('pnpm', ['--filter', definition.name, 'pack', '--pack-destination', destination], {
    cwd: ROOT_DIR,
    maxBuffer: 10 * 1024 * 1024
  });

  const created = (await readdir(destination)).find((file) => !before.has(file) && file.endsWith('.tgz'));
  if (!created) {
    throw new Error(`pnpm pack did not create a tarball for ${definition.name}`);
  }

  return `file:${path.join(destination, created)}`;
}

async function measureOverhead(
  definition: PackageDefinition,
  installSpecs: Map<string, string>,
  installOverrides: Record<string, string>
): Promise<SizeMetric> {
  const overrides = EXPORT_OVERHEAD_OVERRIDES[definition.name] ?? [];
  const overhead: SizeMetric = { minified: 0, gzip: 0 };

  for (const override of overrides) {
    const installSpec = installSpecs.get(override.package);
    if (!installSpec) {
      throw new Error(`Local package tarball missing for ${override.package}`);
    }

    const payload = await getPackageExportSizes(override.package, {
      installSpec,
      installOverrides,
      installTimeout: INSTALL_TIMEOUT_MS
    });

    for (const exportName of override.exports) {
      const asset = payload.assets?.find((candidate) => candidate.name === exportName);
      const metric = requireSize(asset ?? {}, `${override.package} export ${exportName}`);
      overhead.minified += metric.minified;
      overhead.gzip += metric.gzip;
    }
  }

  return overhead;
}

async function measurePackage(
  definition: PackageDefinition,
  installSpecs: Map<string, string>,
  installOverrides: Record<string, string>
): Promise<PackageMeasurement> {
  const installSpec = installSpecs.get(definition.name);
  if (!installSpec) {
    throw new Error(`Local package tarball missing for ${definition.name}`);
  }

  const base = requireSize(
    await getPackageStats(definition.name, {
      installSpec,
      installOverrides,
      installTimeout: INSTALL_TIMEOUT_MS
    }),
    definition.name
  );
  const overhead = await measureOverhead(definition, installSpecs, installOverrides);

  return {
    ...definition,
    minified: base.minified + overhead.minified,
    gzip: base.gzip + overhead.gzip
  };
}

function renderPackageSizeSection(measurements: PackageMeasurement[]): string {
  const rows = measurements.map(
    (measurement) =>
      `| [\`${measurement.name}\`](https://www.npmjs.com/package/${measurement.name}) | ${formatKb(measurement.minified)} | ${formatKb(measurement.gzip)} |`
  );

  return [
    PACKAGE_SIZE_START_MARKER,
    '## 📦 Current package sizes',
    '',
    'These values come from packed workspace packages installed into clean consumer projects, then bundled and minified for production. Framework peer dependencies are external. The Nuxt total includes its Vue runtime component.',
    '',
    '| Package | Minified | Gzip |',
    '| --- | ---: | ---: |',
    ...rows,
    '',
    'The repository generates these values and the README badges with the [bundle-size script](../scripts/update-bundle-size-badges.mts) in a [dedicated GitHub workflow](../.github/workflows/bundle-size.yml).',
    PACKAGE_SIZE_END_MARKER
  ].join('\n');
}

function replaceMarkedSection(document: string, section: string): string {
  const start = document.indexOf(PACKAGE_SIZE_START_MARKER);
  const end = document.indexOf(PACKAGE_SIZE_END_MARKER);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Could not locate package-size markers in ${COMPARISON_PATH}`);
  }

  return `${document.slice(0, start)}${section}${document.slice(end + PACKAGE_SIZE_END_MARKER.length)}`;
}

async function writeComparison(measurements: PackageMeasurement[]): Promise<void> {
  const original = await readFile(COMPARISON_PATH, 'utf8');
  const updated = replaceMarkedSection(original, renderPackageSizeSection(measurements));
  const config = (await prettier.resolveConfig(COMPARISON_PATH)) ?? {};
  const formatted = await prettier.format(updated, {
    ...config,
    parser: 'markdown',
    filepath: COMPARISON_PATH
  });
  await writeFile(COMPARISON_PATH, formatted, 'utf8');
}

async function writeDemoSizes(measurements: PackageMeasurement[]): Promise<void> {
  const entries = measurements.map(
    (measurement) =>
      `  ${measurement.key}: { minified: '${formatKb(measurement.minified)}', gzip: '${formatKb(measurement.gzip)}' }`
  );
  const source = [
    '// Generated by scripts/update-bundle-size-badges.mts. Do not edit manually.',
    'export const bundleSizes = {',
    entries.join(',\n'),
    '} as const;',
    ''
  ].join('\n');

  await mkdir(path.dirname(DEMO_SIZES_PATH), { recursive: true });
  await writeFile(DEMO_SIZES_PATH, source, 'utf8');
}

async function writeBadges(measurements: PackageMeasurement[]): Promise<void> {
  await mkdir(BADGES_DIR, { recursive: true });
  await Promise.all(
    measurements.map((measurement) =>
      writeFile(path.join(BADGES_DIR, measurement.badge), renderBadge(measurement.gzip), 'utf8')
    )
  );
}

async function main(): Promise<void> {
  const packDirectory = await mkdtemp(path.join(tmpdir(), 'phone-mask-bundle-size-'));

  try {
    await buildPackages();

    const installSpecs = new Map<string, string>();
    for (const definition of PACKAGES) {
      installSpecs.set(definition.name, await packPackage(definition, packDirectory));
    }
    const installOverrides = Object.fromEntries(installSpecs);

    const measurements: PackageMeasurement[] = [];
    for (const definition of PACKAGES) {
      console.info(`Measuring ${definition.name}...`);
      measurements.push(await measurePackage(definition, installSpecs, installOverrides));
    }

    await Promise.all([writeBadges(measurements), writeDemoSizes(measurements), writeComparison(measurements)]);

    for (const measurement of measurements) {
      console.info(`${measurement.name}: ${formatKb(measurement.gzip)} gzip`);
    }
  } finally {
    await rm(packDirectory, { recursive: true, force: true });
  }
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
}
