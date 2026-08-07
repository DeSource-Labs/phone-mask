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
type SemverTag = {
  tag: string;
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
};

const DATA_JSON_PATH = 'packages/phone-mask/src/data.json';
const DATA_CHANGE_FILES = new Set([
  DATA_JSON_PATH,
  'packages/phone-mask/src/data.min.js',
  'packages/phone-mask/src/data-types.ts'
]);
const CHANGESET_PATH = '.changeset/google-libphonenumber-mask-sync.md';
const CHANGESET_LEVEL = 'patch';
const GIT_BINARY = '/usr/bin/git';
const PACKAGE_CHANGELOG_RE = /^packages\/[^/]+\/CHANGELOG\.md$/;
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
const nonDataFiles = changedFilesSince(baseRef).filter(isNonDataFile);
const releaseBlockingFiles = nonDataFiles.filter(isReleaseBlockingFile);

if (releaseBlockingFiles.length > 0) {
  await writeStepSummary(baseRef, changes, changelogEntry, nonDataFiles, releaseBlockingFiles);
  throw new Error(
    `Found publish-relevant non-data package changes since ${baseRef}: ${releaseBlockingFiles.join(', ')}. Release those changes first or rerun with a newer base ref.`
  );
}

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
  console.warn(`::notice title=Non-published non-data changes since ${baseRef}::${preview}${suffix}`);
}

await writeStepSummary(baseRef, changes, changelogEntry, nonDataFiles, releaseBlockingFiles);
await writeStepOutputs(changes.length, changelogEntry);

console.log(
  `Prepared mask sync changeset for ${changes.length} country change(s) across ${packageNames.length} package(s).`
);

function resolveLatestReleaseTag(): string {
  const tags = execFileSync(GIT_BINARY, ['tag', '--merged', 'HEAD'], { encoding: 'utf8' })
    .split('\n')
    .map((tag) => tag.trim())
    .map(parseSemverTag)
    .filter((tag): tag is SemverTag => tag !== null)
    .sort(compareSemverTags);

  const latestTag = tags.at(-1)?.tag;

  if (!latestTag) {
    throw new Error('Could not resolve the latest reachable semver release tag. Set MASK_SYNC_BASE_REF explicitly.');
  }

  return latestTag;
}

function assertGitRef(ref: string): void {
  execFileSync(GIT_BINARY, ['rev-parse', '--verify', `${ref}^{commit}`], { stdio: 'ignore' });
}

function gitShow(refPath: string): string {
  return execFileSync(GIT_BINARY, ['show', refPath], { encoding: 'utf8' });
}

function changedFilesSince(ref: string): string[] {
  return execFileSync(GIT_BINARY, ['diff', '--name-only', `${ref}..HEAD`], { encoding: 'utf8' })
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);
}

function isNonDataFile(file: string): boolean {
  return !DATA_CHANGE_FILES.has(file);
}

function isReleaseBlockingFile(file: string): boolean {
  return file.startsWith('packages/') && !PACKAGE_CHANGELOG_RE.test(file);
}

function parseSemverTag(tag: string): SemverTag | null {
  const match = /^(?:v)?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(tag);
  if (!match) return null;

  return {
    tag,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]?.split('.') ?? []
  };
}

function compareSemverTags(left: SemverTag, right: SemverTag): number {
  return (
    compareNumbers(left.major, right.major) ||
    compareNumbers(left.minor, right.minor) ||
    compareNumbers(left.patch, right.patch) ||
    comparePrerelease(left.prerelease, right.prerelease)
  );
}

function compareNumbers(left: number, right: number): number {
  return left - right;
}

function comparePrerelease(left: string[], right: string[]): number {
  if (left.length === 0 && right.length === 0) return 0;
  if (left.length === 0) return 1;
  if (right.length === 0) return -1;

  const maxLength = Math.max(left.length, right.length);
  for (let index = 0; index < maxLength; index += 1) {
    const leftIdentifier = left[index];
    const rightIdentifier = right[index];

    if (leftIdentifier === undefined) return -1;
    if (rightIdentifier === undefined) return 1;

    const comparison = comparePrereleaseIdentifier(leftIdentifier, rightIdentifier);
    if (comparison !== 0) return comparison;
  }

  return 0;
}

function comparePrereleaseIdentifier(left: string, right: string): number {
  const leftNumeric = /^\d+$/.test(left);
  const rightNumeric = /^\d+$/.test(right);

  if (leftNumeric && rightNumeric) {
    return compareNumbers(Number(left), Number(right));
  }

  if (leftNumeric) return -1;
  if (rightNumeric) return 1;

  return left.localeCompare(right, 'en');
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
  return [...countryCode].map(countryCodeLetterToRegionalIndicator).join('');
}

function countryCodeLetterToRegionalIndicator(char: string): string {
  const codePoint = char.codePointAt(0);

  if (codePoint === undefined) {
    return '';
  }

  return String.fromCodePoint(0x1f1e6 + codePoint - 65);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

async function writeStepSummary(
  ref: string,
  changes: CountryChange[],
  changelogEntry: string,
  nonDataFiles: string[],
  releaseBlockingFiles: string[]
): Promise<void> {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;

  const nonDataSection =
    nonDataFiles.length === 0
      ? 'No non-data files changed since the compare ref.'
      : `Non-data files changed since the compare ref:\n\n${nonDataFiles.map(formatMarkdownFileListItem).join('\n')}`;
  const releaseBlockingSection =
    releaseBlockingFiles.length === 0
      ? 'No publish-relevant non-data package files changed since the compare ref.'
      : `Publish-relevant non-data package files changed since the compare ref:\n\n${releaseBlockingFiles.map(formatMarkdownFileListItem).join('\n')}`;

  await appendFile(
    summaryPath,
    `## Google libphonenumber mask sync\n\nBase ref: \`${ref}\`\n\nCountry changes: ${changes.length}\n\n${changelogEntry}\n\n${nonDataSection}\n\n${releaseBlockingSection}\n`
  );
}

function formatMarkdownFileListItem(file: string): string {
  return `- \`${file}\``;
}

async function writeStepOutputs(changeCount: number, changelogEntry: string): Promise<void> {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;

  const delimiter = `CHANGELOG_${Date.now()}`;
  await appendFile(outputPath, `changeset_path=${CHANGESET_PATH}\n`);
  await appendFile(outputPath, `change_count=${changeCount}\n`);
  await appendFile(outputPath, `changelog<<${delimiter}\n${changelogEntry}\n${delimiter}\n`);
}
