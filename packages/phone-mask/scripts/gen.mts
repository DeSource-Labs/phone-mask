/**
 * Generate phone masks from official Google libphonenumber release artifacts.
 *
 * Source of truth:
 * - https://github.com/google/libphonenumber
 * - resources/PhoneNumberMetadata.xml from latest release tarball
 *
 * Output:
 * - src/data.json
 * - src/data.min.js
 * - src/data-types.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GITHUB_RELEASE_LATEST_API = 'https://api.github.com/repos/google/libphonenumber/releases/latest';
const GITHUB_ORIGIN = 'https://github.com';
const LIBPHONENUMBER_RELEASE_TAG_RE = /^v\d+\.\d+\.\d+$/;
const METADATA_PATH_SUFFIX = '/resources/PhoneNumberMetadata.xml';
const JS_IDENTIFIER_RE = /^[A-Za-z_$][0-9A-Za-z_$]*$/;
const ESCAPED_SINGLE_QUOTE = String.raw`\'`;
const ESCAPED_NEWLINE = String.raw`\n`;
const ESCAPED_CARRIAGE_RETURN = String.raw`\r`;
const ESCAPED_TAB = String.raw`\t`;

const EXAMPLE_TYPES = [
  'mobile',
  'fixedLine',
  'tollFree',
  'premiumRate',
  'sharedCost',
  'voip',
  'personalNumber',
  'pager'
] as const;

type ExampleType = (typeof EXAMPLE_TYPES)[number];
type XmlAttributes = Record<string, string>;
type NumberFormat = {
  pattern: string;
  format: string;
  intlFormat: string | null;
  leadingDigits: string[];
};
type ExamplesByType = Partial<Record<ExampleType, string>>;
type Territory = {
  id: string;
  countryCode: string;
  isMainCountryForCode: boolean;
  formats: NumberFormat[];
  examplesByType: ExamplesByType;
};
type MaskMapping = Record<string, string | string[]>;
type ParsedMaskEntity = {
  code: string;
  mask: string;
};
type MinifiedData = {
  masks: string[];
  countries: Record<string, string>;
};
type SerializableJsValue =
  | string
  | number
  | boolean
  | null
  | SerializableJsValue[]
  | { [key: string]: SerializableJsValue };
type GitHubRelease = {
  tag_name?: unknown;
};

function readNullTerminatedAscii(buffer: Buffer): string {
  const index = buffer.indexOf(0);
  const end = index === -1 ? buffer.length : index;
  return buffer.subarray(0, end).toString('utf8');
}

function parseTarOctal(octalStr: string): number {
  const clean = octalStr.replaceAll('\0', '').trim();
  if (!clean) return 0;
  return Number.parseInt(clean, 8);
}

function extractFileFromTarGz(archiveBuffer: Buffer, filePathSuffix: string): string {
  const tarBuffer = zlib.gunzipSync(archiveBuffer);
  let offset = 0;

  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.subarray(offset, offset + 512);
    const isZeroBlock = header.every((byte) => byte === 0);
    if (isZeroBlock) break;

    const name = readNullTerminatedAscii(header.subarray(0, 100));
    const prefix = readNullTerminatedAscii(header.subarray(345, 500));
    const fullName = prefix ? `${prefix}/${name}` : name;
    const size = parseTarOctal(readNullTerminatedAscii(header.subarray(124, 136)));
    const typeFlag = header[156];
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;

    const isRegularFile = typeFlag === 0 || typeFlag === 48;
    if (isRegularFile && fullName.endsWith(filePathSuffix)) {
      return tarBuffer.subarray(dataStart, dataEnd).toString('utf8');
    }

    const paddedSize = Math.ceil(size / 512) * 512;
    offset = dataStart + paddedSize;
  }

  throw new Error(`Failed to locate file in archive with suffix: ${filePathSuffix}`);
}

function decodeXmlEntities(value: string): string {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
}

function isAsciiWhitespace(char: string): boolean {
  return char === ' ' || char === '\n' || char === '\r' || char === '\t';
}

function skipAsciiWhitespace(value: string, offset: number): number {
  let current = offset;
  while (current < value.length && isAsciiWhitespace(value[current])) current += 1;
  return current;
}

function isXmlAttributeNameStart(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || char === '_';
}

function isXmlAttributeNameChar(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return isXmlAttributeNameStart(char) || (code >= 48 && code <= 57) || char === ':' || char === '.' || char === '-';
}

function parseAttributes(raw: string): XmlAttributes {
  const attrs: XmlAttributes = {};

  let offset = 0;
  while (offset < raw.length) {
    offset = skipAsciiWhitespace(raw, offset);
    if (offset >= raw.length) break;

    if (!isXmlAttributeNameStart(raw[offset])) {
      offset += 1;
      continue;
    }

    const nameStart = offset;
    offset += 1;
    while (offset < raw.length && isXmlAttributeNameChar(raw[offset])) offset += 1;

    const name = raw.slice(nameStart, offset);
    const equalsOffset = skipAsciiWhitespace(raw, offset);
    if (raw[equalsOffset] !== '=') {
      offset = Math.max(equalsOffset, offset + 1);
      continue;
    }

    const quoteOffset = skipAsciiWhitespace(raw, equalsOffset + 1);
    if (raw[quoteOffset] !== '"') {
      offset = Math.max(quoteOffset, equalsOffset + 1);
      continue;
    }

    const valueStart = quoteOffset + 1;
    const valueEnd = raw.indexOf('"', valueStart);
    if (valueEnd === -1) break;

    attrs[name] = decodeXmlEntities(raw.slice(valueStart, valueEnd));
    offset = valueEnd + 1;
  }

  return attrs;
}

function tagText(block: string, tagName: string): string | null {
  const re = new RegExp(String.raw`<${tagName}\b[^>]*>([\s\S]*?)<\/${tagName}>`);
  const match = re.exec(block);
  if (!match) return null;
  return decodeXmlEntities(match[1].trim());
}

function normalizeRegexText(value: string): string {
  return value.replaceAll(/\s+/g, '');
}

function extractDigits(value: string): string {
  return value.replaceAll(/\D/g, '');
}

function uniquePreserveOrder(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    if (!item || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function parseNumberFormats(territoryBlock: string): NumberFormat[] {
  const availableFormats = /<availableFormats\b[^>]*>([\s\S]*?)<\/availableFormats>/.exec(territoryBlock)?.[1];
  if (!availableFormats) return [];

  const formats: NumberFormat[] = [];
  const numberFormatRe = /<numberFormat\b([^>]*)>([\s\S]*?)<\/numberFormat>/g;

  for (const match of availableFormats.matchAll(numberFormatRe)) {
    const attrs = parseAttributes(match[1]);
    const body = match[2];

    const patternFromAttr = attrs.pattern ? normalizeRegexText(attrs.pattern) : null;
    const patternFromTag = tagText(body, 'pattern');
    const pattern = patternFromAttr ?? (patternFromTag ? normalizeRegexText(patternFromTag) : null);
    if (!pattern) continue;

    const format = tagText(body, 'format');
    if (!format) continue;

    const intlFormat = tagText(body, 'intlFormat');
    const leadingDigits: string[] = [];
    for (const ldMatch of body.matchAll(/<leadingDigits\b[^>]*>([\s\S]*?)<\/leadingDigits>/g)) {
      leadingDigits.push(normalizeRegexText(decodeXmlEntities(ldMatch[1].trim())));
    }

    formats.push({
      pattern,
      format,
      intlFormat,
      leadingDigits
    });
  }

  return formats;
}

function collectExampleDigitsByType(territoryBlock: string): ExamplesByType {
  const examplesByType: ExamplesByType = {};

  for (const typeName of EXAMPLE_TYPES) {
    const sectionRe = new RegExp(String.raw`<${typeName}\b[^>]*>([\s\S]*?)<\/${typeName}>`);
    const sectionMatch = sectionRe.exec(territoryBlock);
    if (!sectionMatch) continue;

    const example = tagText(sectionMatch[1], 'exampleNumber');
    if (!example) continue;

    const digits = extractDigits(example);
    if (digits) examplesByType[typeName] = digits;
  }

  return examplesByType;
}

function matchesLeadingDigits(number: string, leadingDigits: string[]): boolean {
  if (!leadingDigits || leadingDigits.length === 0) return true;

  // libphonenumber uses progressively more specific leading-digits patterns;
  // the last one is the strictest selector for final formatting choice.
  const strictest = leadingDigits[leadingDigits.length - 1];
  try {
    const re = new RegExp(`^(?:${strictest})`);
    return re.test(number);
  } catch {
    return false;
  }
}

function formatNationalNumber(number: string, formats: NumberFormat[]): string {
  for (const entry of formats) {
    if (!matchesLeadingDigits(number, entry.leadingDigits)) continue;

    let patternRe;
    try {
      patternRe = new RegExp(`^${entry.pattern}$`);
    } catch {
      continue;
    }

    if (!patternRe.test(number)) continue;

    if (entry.intlFormat === 'NA') continue;
    const replacement = entry.intlFormat ?? entry.format;
    if (!replacement) continue;

    return number.replace(patternRe, replacement).trim();
  }

  return number;
}

function maskNationalNumber(nationalFormatted: string): string {
  return nationalFormatted.replaceAll(/\d/g, '#').replaceAll(/\s+/g, ' ').trim();
}

function pushMaskForExample(
  countryCode: string,
  formats: NumberFormat[],
  exampleDigits: string | null | undefined,
  acc: string[]
): void {
  if (!exampleDigits) return;
  const formattedNational = formatNationalNumber(exampleDigits, formats);
  const maskedNational = maskNationalNumber(formattedNational);
  if (!maskedNational) return;
  acc.push(`+${countryCode} ${maskedNational}`.trim());
}

function buildRegionMasks(countryCode: string, formats: NumberFormat[], examplesByType: ExamplesByType): string[] {
  const masks: string[] = [];

  // Mirror FIXED_LINE_OR_MOBILE intent from old implementation:
  // prefer fixed-line example, fallback to mobile.
  const fixedOrMobile = examplesByType.fixedLine || examplesByType.mobile || null;
  pushMaskForExample(countryCode, formats, fixedOrMobile, masks);

  for (const typeName of EXAMPLE_TYPES) {
    pushMaskForExample(countryCode, formats, examplesByType[typeName], masks);
  }

  // Keep the legacy fallback pass to preserve behavior ordering/coverage.
  const fallback = fixedOrMobile || examplesByType.mobile || null;
  pushMaskForExample(countryCode, formats, fallback, masks);

  return uniquePreserveOrder(masks);
}

function parseTerritories(xml: string): Territory[] {
  const territories: Territory[] = [];
  const territoryRe = /<territory\b([^>]*)>([\s\S]*?)<\/territory>/g;

  for (const match of xml.matchAll(territoryRe)) {
    const attrs = parseAttributes(match[1]);
    const territoryBlock = match[2];
    const id = (attrs.id || '').trim().toUpperCase();
    const countryCode = (attrs.countryCode || '').trim();
    const isMainCountryForCode = attrs.mainCountryForCode === 'true';

    if (!/^[A-Z]{2}$/.test(id)) continue;
    if (!/^\d+$/.test(countryCode)) continue;

    const formats = parseNumberFormats(territoryBlock);
    const examplesByType = collectExampleDigitsByType(territoryBlock);
    territories.push({
      id,
      countryCode,
      isMainCountryForCode,
      formats,
      examplesByType
    });
  }

  return territories;
}

function buildMainRegionByCode(territories: Territory[]): Map<string, string> {
  const mainRegionByCode = new Map<string, string>();

  for (const territory of territories) {
    if (territory.isMainCountryForCode) {
      mainRegionByCode.set(territory.countryCode, territory.id);
    }
  }
  for (const territory of territories) {
    if (!mainRegionByCode.has(territory.countryCode)) {
      mainRegionByCode.set(territory.countryCode, territory.id);
    }
  }

  return mainRegionByCode;
}

function getEffectiveFormats(
  territory: Territory,
  territoryById: Map<string, Territory>,
  mainRegionByCode: Map<string, string>
): NumberFormat[] {
  if (territory.formats.length > 0) return territory.formats;

  const mainRegionId = mainRegionByCode.get(territory.countryCode);
  const mainRegion = mainRegionId ? territoryById.get(mainRegionId) : null;
  if (mainRegion && mainRegion.formats.length > 0) {
    return mainRegion.formats;
  }

  return territory.formats;
}

function buildMapping(
  territories: Territory[],
  territoryById: Map<string, Territory>,
  mainRegionByCode: Map<string, string>
): MaskMapping {
  const mapping: MaskMapping = {};

  for (const territory of territories) {
    const effectiveFormats = getEffectiveFormats(territory, territoryById, mainRegionByCode);
    const masks = buildRegionMasks(territory.countryCode, effectiveFormats, territory.examplesByType);
    if (masks.length === 0) continue;
    mapping[territory.id] = masks.length === 1 ? masks[0] : masks;
  }

  return mapping;
}

function sortMappingByCountryCode(mapping: MaskMapping): MaskMapping {
  const sortedEntries = Object.entries(mapping).sort((a, b) => a[0].localeCompare(b[0], 'en'));
  return Object.fromEntries(sortedEntries);
}

function parseMetadataXmlToMasks(xml: string): MaskMapping {
  const territories = parseTerritories(xml);
  const territoryById = new Map(territories.map((territory) => [territory.id, territory]));
  const mainRegionByCode = buildMainRegionByCode(territories);
  const mapping = buildMapping(territories, territoryById, mainRegionByCode);
  return sortMappingByCountryCode(mapping);
}

function parseMaskEntity(maskEntity: string): ParsedMaskEntity {
  const splitAt = maskEntity.indexOf(' ');
  if (splitAt <= 1 || !maskEntity.startsWith('+') || splitAt === maskEntity.length - 1) {
    throw new Error(`Invalid mask entity, expected "+<code> <mask>": ${maskEntity}`);
  }

  const code = maskEntity.slice(1, splitAt);
  const mask = maskEntity.slice(splitAt + 1);
  return { code, mask };
}

function buildMinifiedData(mapping: MaskMapping): MinifiedData {
  const countryEntries = Object.entries(mapping).sort((a, b) => a[0].localeCompare(b[0], 'en'));
  const maskFrequency = new Map<string, number>();

  for (const [, maskEntity] of countryEntries) {
    const items = Array.isArray(maskEntity) ? maskEntity : [maskEntity];
    for (const item of items) {
      const { mask } = parseMaskEntity(item);
      maskFrequency.set(mask, (maskFrequency.get(mask) ?? 0) + 1);
    }
  }

  const masks = [...maskFrequency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'))
    .map(([mask]) => mask);

  const maskIndex = new Map<string, number>(masks.map((mask, idx) => [mask, idx]));
  const countries: Record<string, string> = {};

  for (const [country, maskEntity] of countryEntries) {
    const items = Array.isArray(maskEntity) ? maskEntity : [maskEntity];
    const parsed = items.map(parseMaskEntity);
    const code = parsed[0]?.code ?? '';
    if (!code) continue;
    if (parsed.some((entry) => entry.code !== code)) {
      throw new Error(`Mixed country codes in ${country}`);
    }

    const indexedMasks = parsed.map((entry) => {
      const index = maskIndex.get(entry.mask);
      if (index === undefined) {
        throw new Error(`Mask not found in dictionary: ${entry.mask}`);
      }
      return String(index);
    });

    countries[country] = [code, ...indexedMasks].join('|');
  }

  return { masks, countries };
}

function escapeJsString(value: string): string {
  return `'${value
    .replaceAll('\\', '\\\\')
    .replaceAll("'", ESCAPED_SINGLE_QUOTE)
    .replaceAll('\n', ESCAPED_NEWLINE)
    .replaceAll('\r', ESCAPED_CARRIAGE_RETURN)
    .replaceAll('\t', ESCAPED_TAB)}'`;
}

function serializeJsKey(key: string): string {
  return JS_IDENTIFIER_RE.test(key) ? key : escapeJsString(key);
}

function serializeJsValue(value: SerializableJsValue): string {
  if (typeof value === 'string') return escapeJsString(value);
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    return `[${value.map((item) => serializeJsValue(item)).join(',')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    const serializedEntries = entries.map(([key, item]) => `${serializeJsKey(key)}:${serializeJsValue(item)}`);
    return '{' + serializedEntries.join(',') + '}';
  }

  throw new Error(`Unsupported value type for JS serialization: ${String(value)}`);
}

async function fetchJson<T>(url: string | URL): Promise<T> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
    headers: {
      accept: 'application/vnd.github+json',
      'user-agent': 'desource-phone-mask-generator'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching release metadata`);
  }

  return response.json() as Promise<T>;
}

async function fetchArrayBuffer(url: string | URL): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(60_000),
    headers: {
      'user-agent': 'desource-phone-mask-generator'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while downloading release archive`);
  }

  return response.arrayBuffer();
}

// GitHub release metadata is external input. Only vX.Y.Z tags are accepted
// before the value is used as a path segment in the trusted archive URL.
function validateReleaseTag(value: unknown): string {
  if (!value || typeof value !== 'string') {
    throw new Error('Failed to resolve latest libphonenumber release tag');
  }

  const tag = value.trim();
  if (!LIBPHONENUMBER_RELEASE_TAG_RE.test(tag)) {
    throw new Error('Unexpected libphonenumber release tag format');
  }

  return tag;
}

function releaseArchiveUrl(validatedTag: string): URL {
  return new URL(`/google/libphonenumber/archive/refs/tags/${encodeURIComponent(validatedTag)}.tar.gz`, GITHUB_ORIGIN);
}

function writeOutputs(mapping: MaskMapping): void {
  const outDir = path.join(PACKAGE_ROOT, 'src');
  fs.mkdirSync(outDir, { recursive: true });

  const keys = Object.keys(mapping);
  const countryKeyUnion = keys.map((key) => `'${key}'`).join(' | ');
  const jsonPath = path.join(outDir, 'data.json');
  const minPath = path.join(outDir, 'data.min.js');
  const typesPath = path.join(outDir, 'data-types.ts');

  const min = buildMinifiedData(mapping);

  fs.writeFileSync(jsonPath, `${JSON.stringify(mapping, null, 2)}\n`, 'utf8');

  fs.writeFileSync(
    minPath,
    `export const masks = ${serializeJsValue(min.masks)};\nexport default ${serializeJsValue(min.countries)};\n`,
    'utf8'
  );
  fs.writeFileSync(typesPath, `export type CountryKey = ${countryKeyUnion};\n`, 'utf8');

  console.info(`Wrote ${jsonPath}`);
  console.info(`Wrote ${minPath}`);
  console.info(`Wrote ${typesPath}`);
}

async function main(): Promise<void> {
  const latestRelease = await fetchJson<GitHubRelease>(GITHUB_RELEASE_LATEST_API);
  const validatedTag = validateReleaseTag(latestRelease?.tag_name);
  const archiveUrl = releaseArchiveUrl(validatedTag);

  console.info('Using latest validated libphonenumber release:', validatedTag);
  console.info('Downloading libphonenumber release archive:', archiveUrl.href);

  const archiveBuffer = Buffer.from(await fetchArrayBuffer(archiveUrl));
  const metadataXml = extractFileFromTarGz(archiveBuffer, METADATA_PATH_SUFFIX);
  const mapping = parseMetadataXmlToMasks(metadataXml);

  if (Object.keys(mapping).length === 0) {
    throw new Error('Generated mapping is empty');
  }

  writeOutputs(mapping);
}

try {
  await main();
} catch {
  console.error('Failed to generate phone mask data');
  process.exit(1);
}
