import { execFileSync } from 'node:child_process';
import { appendFile, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

type MaskValue = string | string[];
type MaskMapping = Record<string, MaskValue>;
type ChangesetsConfig = {
  fixed?: string[][];
};
type PackageJson = {
  name?: string;
  private?: boolean;
};
type CountryChangeKind = 'added' | 'removed' | 'updated';
type CountryChange = {
  code: string;
  kind: CountryChangeKind;
  name: string;
};

const DATA_JSON_PATH = 'packages/phone-mask/src/data.json';
const DATA_CHANGE_FILES = new Set([
  DATA_JSON_PATH,
  'packages/phone-mask/src/data.min.js',
  'packages/phone-mask/src/data-types.ts'
]);
const CHANGESET_PATH = '.changeset/google-libphonenumber-mask-sync.md';
const CHANGESET_LEVEL = 'patch';
const CHANGE_KIND_ORDER: Record<CountryChangeKind, number> = {
  added: 0,
  removed: 1,
  updated: 2
};
const CHANGE_LABEL_BY_KIND: Record<CountryChangeKind, string> = {
  added: 'support',
  removed: 'is no longer supported',
  updated: 'updates'
};
const regionDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' });

const baseRef = process.env.MASK_SYNC_BASE_REF?.trim() || resolveLatestReleaseTag();
const dryRun = process.env.MASK_SYNC_DRY_RUN === '1' || process.env.MASK_SYNC_DRY_RUN === 'true';

assertGitRef(baseRef);
await assertNoActiveChangesets();

const previousData = parseMaskMapping(gitShow(`${baseRef}:${DATA_JSON_PATH}`), `${baseRef}:${DATA_JSON_PATH}`);
const currentData = parseMaskMapping(await readFile(DATA_JSON_PATH, 'utf8'), DATA_JSON_PATH);
const changes = findCountryChanges(previousData, currentData);

if (changes.length === 0) {
  throw new Error(`No country mask changes detected between ${baseRef} and the current ${DATA_JSON_PATH}`);
}

const packageNames = await readReleasePackageNames();
if (packageNames.length === 0) {
  throw new Error('Could not resolve any packages to include in the mask sync changeset.');
}

const changelogEntry = formatChangelogEntry(changes);
const changeset = formatChangeset(packageNames, changelogEntry);
const nonDataFiles = changedFilesSince(baseRef).filter((file) => !DATA_CHANGE_FILES.has(file));

if (dryRun) {
  console.log(`Dry run: would create ${CHANGESET_PATH}`);
  console.log(changeset.trimEnd());
} else {
  await writeFile(CHANGESET_PATH, changeset);
  console.log(`Created ${CHANGESET_PATH}`);
}

if (nonDataFiles.length > 0) {
  const preview = nonDataFiles.slice(0, 20).join(', ');
  const suffix = nonDataFiles.length > 20 ? `, and ${nonDataFiles.length - 20} more` : '';
  console.warn(`::warning title=Non-data changes since ${baseRef}::${preview}${suffix}`);
}

await writeStepSummary(baseRef, changes, changelogEntry, nonDataFiles);
await writeStepOutputs(changes.length, changelogEntry);

console.log(
  `Prepared mask sync changeset for ${changes.length} country change(s) across ${packageNames.length} package(s).`
);

function resolveLatestReleaseTag(): string {
  const tags = execFileSync('git', ['tag', '--merged', 'HEAD', '--sort=-version:refname'], { encoding: 'utf8' })
    .split('\n')
    .map((tag) => tag.trim())
    .filter((tag) => /^(?:v)?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(tag));

  const latestTag = tags[0];
  if (!latestTag) {
    throw new Error('Could not resolve the latest reachable semver release tag. Set MASK_SYNC_BASE_REF explicitly.');
  }

  return latestTag;
}

function assertGitRef(ref: string): void {
  execFileSync('git', ['rev-parse', '--verify', `${ref}^{commit}`], { stdio: 'ignore' });
}

function gitShow(refPath: string): string {
  return execFileSync('git', ['show', refPath], { encoding: 'utf8' });
}

function changedFilesSince(ref: string): string[] {
  return execFileSync('git', ['diff', '--name-only', `${ref}..HEAD`], { encoding: 'utf8' })
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);
}

async function assertNoActiveChangesets(): Promise<void> {
  const entries = await readdir('.changeset');
  const activeChangesets = entries.filter((entry) => entry.endsWith('.md') && entry !== 'README.md');

  if (activeChangesets.length > 0) {
    throw new Error(
      `Active changeset files already exist: ${activeChangesets.join(', ')}. Resolve them before creating an automated mask sync release.`
    );
  }
}

async function readReleasePackageNames(): Promise<string[]> {
  const config = JSON.parse(await readFile('.changeset/config.json', 'utf8')) as ChangesetsConfig;
  const fixedPackageNames = unique((config.fixed ?? []).flat());

  if (fixedPackageNames.length > 0) {
    return fixedPackageNames;
  }

  const packageDirectories = await readdir('packages', { withFileTypes: true });
  const packageNames = await Promise.all(
    packageDirectories
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const packageJsonPath = path.join('packages', entry.name, 'package.json');
        const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as PackageJson;
        return packageJson.private === true ? null : packageJson.name;
      })
  );

  return packageNames.filter((name): name is string => Boolean(name));
}

function parseMaskMapping(raw: string, label: string): MaskMapping {
  const parsed = JSON.parse(raw) as unknown;

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must contain a JSON object`);
  }

  const mapping = parsed as Record<string, unknown>;

  for (const [code, value] of Object.entries(mapping)) {
    if (!/^[A-Z]{2}$/.test(code)) {
      throw new Error(`${label} contains an invalid country code: ${code}`);
    }

    if (typeof value === 'string') continue;

    if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
      continue;
    }

    throw new Error(`${label} contains an invalid mask value for ${code}`);
  }

  return mapping as MaskMapping;
}

function findCountryChanges(previousData: MaskMapping, currentData: MaskMapping): CountryChange[] {
  const previousCodes = new Set(Object.keys(previousData));
  const currentCodes = new Set(Object.keys(currentData));
  const changes: CountryChange[] = [];

  for (const code of currentCodes) {
    if (!previousCodes.has(code)) {
      changes.push(countryChange(code, 'added'));
    }
  }

  for (const code of previousCodes) {
    if (!currentCodes.has(code)) {
      changes.push(countryChange(code, 'removed'));
    }
  }

  for (const code of currentCodes) {
    if (previousCodes.has(code) && !isSameMaskValue(previousData[code], currentData[code])) {
      changes.push(countryChange(code, 'updated'));
    }
  }

  return changes.sort(
    (a, b) => CHANGE_KIND_ORDER[a.kind] - CHANGE_KIND_ORDER[b.kind] || a.name.localeCompare(b.name, 'en')
  );
}

function countryChange(code: string, kind: CountryChangeKind): CountryChange {
  return {
    code,
    kind,
    name: regionDisplayNames.of(code) ?? code
  };
}

function isSameMaskValue(left: MaskValue, right: MaskValue): boolean {
  const leftMasks = toMaskArray(left);
  const rightMasks = toMaskArray(right);

  return leftMasks.length === rightMasks.length && leftMasks.every((mask, index) => mask === rightMasks[index]);
}

function toMaskArray(value: MaskValue): string[] {
  return Array.isArray(value) ? value : [value];
}

function formatChangeset(packageNames: string[], changelogEntry: string): string {
  const releaseFrontmatter = packageNames.map((packageName) => `'${packageName}': ${CHANGESET_LEVEL}`).join('\n');

  return `---\n${releaseFrontmatter}\n---\n\n${changelogEntry}\n`;
}

function formatChangelogEntry(changes: CountryChange[]): string {
  const lines = changes.map(
    (change) =>
      `  - Sync country masks with google-libphonenumber (${countryFlag(change.code)} ${change.name} ${CHANGE_LABEL_BY_KIND[change.kind]})`
  );

  return ['Core Upgrades:', ...lines].join('\n');
}

function countryFlag(countryCode: string): string {
  return [...countryCode].map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65)).join('');
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

async function writeStepSummary(
  ref: string,
  changes: CountryChange[],
  changelogEntry: string,
  nonDataFiles: string[]
): Promise<void> {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;

  const nonDataSection =
    nonDataFiles.length === 0
      ? 'No non-data files changed since the compare ref.'
      : `Non-data files changed since the compare ref:\n\n${nonDataFiles.map((file) => `- \`${file}\``).join('\n')}`;

  await appendFile(
    summaryPath,
    `## Google libphonenumber mask sync\n\nBase ref: \`${ref}\`\n\nCountry changes: ${changes.length}\n\n${changelogEntry}\n\n${nonDataSection}\n`
  );
}

async function writeStepOutputs(changeCount: number, changelogEntry: string): Promise<void> {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;

  const delimiter = `CHANGELOG_${Date.now()}`;
  await appendFile(outputPath, `changeset_path=${CHANGESET_PATH}\n`);
  await appendFile(outputPath, `change_count=${changeCount}\n`);
  await appendFile(outputPath, `changelog<<${delimiter}\n${changelogEntry}\n${delimiter}\n`);
}
