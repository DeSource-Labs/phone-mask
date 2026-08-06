import { appendFile, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface PackageJson {
  name?: string;
  private?: boolean;
  version?: string;
}

const rootDirectory = process.cwd();
const packagesDirectory = path.join(rootDirectory, 'packages');
const corePackageDirectory = path.join(packagesDirectory, 'phone-mask');
const corePackageJson = await readPackageJson(path.join(corePackageDirectory, 'package.json'));
const version = corePackageJson.version;

if (!version || !isSemver(version)) {
  throw new Error(`Core package has an invalid version: ${String(version)}`);
}

const packageEntries = await readdir(packagesDirectory, { withFileTypes: true });
const publicPackages = await Promise.all(
  packageEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => readPackageJson(path.join(packagesDirectory, entry.name, 'package.json')))
).then((packages) => packages.filter((packageJson) => packageJson.private !== true));

const mismatchedPackages = publicPackages.filter((packageJson) => packageJson.version !== version);

if (mismatchedPackages.length > 0) {
  const mismatches = mismatchedPackages
    .map((packageJson) => `${packageJson.name ?? '<unnamed>'}@${packageJson.version ?? '<missing>'}`)
    .join(', ');

  throw new Error(`All public packages must use the core version ${version}. Mismatched packages: ${mismatches}`);
}

const changelog = await readFile(path.join(corePackageDirectory, 'CHANGELOG.md'), 'utf8');
const releaseNotes = extractChangelogEntry(changelog, version);
const releaseNotesPath = process.env.RELEASE_NOTES_PATH;

if (!releaseNotesPath) {
  throw new Error('RELEASE_NOTES_PATH must point to the release notes output file');
}

await writeFile(releaseNotesPath, `${releaseNotes}\n`);

if (process.env.GITHUB_OUTPUT) {
  const versionWithoutBuild = version.split('+', 1)[0];

  await appendFile(process.env.GITHUB_OUTPUT, `version=${version}\n`);
  await appendFile(process.env.GITHUB_OUTPUT, `prerelease=${versionWithoutBuild.includes('-')}\n`);
}

console.log(`Prepared GitHub release ${version} for ${publicPackages.length} packages`);

async function readPackageJson(packageJsonPath: string): Promise<PackageJson> {
  const contents = await readFile(packageJsonPath, 'utf8');

  return JSON.parse(contents) as PackageJson;
}

function extractChangelogEntry(changelog: string, targetVersion: string): string {
  const escapedVersion = targetVersion.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const heading = new RegExp(String.raw`^##\s+${escapedVersion}\s*$`, 'm');
  const match = heading.exec(changelog);

  if (!match) {
    throw new Error(`Core changelog does not contain a ${targetVersion} release entry`);
  }

  const entryStart = match.index + match[0].length;
  const remainingChangelog = changelog.slice(entryStart);
  const nextHeading = /^##\s+/m.exec(remainingChangelog);
  const entry = remainingChangelog.slice(0, nextHeading?.index).trim();

  if (!entry) {
    throw new Error(`Core changelog entry for ${targetVersion} is empty`);
  }

  return entry;
}

function isSemver(value: string): boolean {
  const buildSeparator = value.indexOf('+');

  if (buildSeparator !== value.lastIndexOf('+')) {
    return false;
  }

  const versionWithoutBuild = buildSeparator === -1 ? value : value.slice(0, buildSeparator);
  const build = buildSeparator === -1 ? undefined : value.slice(buildSeparator + 1);

  if (build !== undefined && !hasValidIdentifiers(build)) {
    return false;
  }

  const prereleaseSeparator = versionWithoutBuild.indexOf('-');
  const core = prereleaseSeparator === -1 ? versionWithoutBuild : versionWithoutBuild.slice(0, prereleaseSeparator);
  const prerelease = prereleaseSeparator === -1 ? undefined : versionWithoutBuild.slice(prereleaseSeparator + 1);

  return isValidCoreVersion(core) && (prerelease === undefined || isValidPrerelease(prerelease));
}

function isValidCoreVersion(value: string): boolean {
  const identifiers = value.split('.');

  return identifiers.length === 3 && identifiers.every(isValidNumericIdentifier);
}

function isValidPrerelease(value: string): boolean {
  return (
    hasValidIdentifiers(value) &&
    value.split('.').every((identifier) => !/^\d+$/.test(identifier) || isValidNumericIdentifier(identifier))
  );
}

function hasValidIdentifiers(value: string): boolean {
  return value.split('.').every((identifier) => /^[0-9A-Za-z-]+$/.test(identifier));
}

function isValidNumericIdentifier(value: string): boolean {
  return /^(?:0|[1-9]\d*)$/.test(value);
}
