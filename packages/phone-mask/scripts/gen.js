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
 * - src/data.v2.min.js
 * - src/data.v3.min.js
 * - src/data-types.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GITHUB_RELEASE_LATEST_API = 'https://api.github.com/repos/google/libphonenumber/releases/latest';
const RELEASE_ARCHIVE_URL = (tag) => `https://github.com/google/libphonenumber/archive/refs/tags/${tag}.tar.gz`;
const METADATA_PATH_SUFFIX = '/resources/PhoneNumberMetadata.xml';
const TOKEN_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
const TOKEN_BASE = TOKEN_ALPHABET.length;
const JS_IDENTIFIER_RE = /^[A-Za-z_$][0-9A-Za-z_$]*$/;

const EXAMPLE_TYPES = [
  'mobile',
  'fixedLine',
  'tollFree',
  'premiumRate',
  'sharedCost',
  'voip',
  'personalNumber',
  'pager'
];

function readNullTerminatedAscii(buffer) {
  const index = buffer.indexOf(0);
  const end = index === -1 ? buffer.length : index;
  return buffer.subarray(0, end).toString('utf8');
}

function parseTarOctal(octalStr) {
  const clean = octalStr.replaceAll('\0', '').trim();
  if (!clean) return 0;
  return Number.parseInt(clean, 8);
}

function extractFileFromTarGz(archiveBuffer, filePathSuffix) {
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

function decodeXmlEntities(value) {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
}

function parseAttributes(raw) {
  const attrs = {};
  const re = /([A-Za-z_][\w:.-]*)="([^"]*)"/g;
  for (const match of raw.matchAll(re)) {
    attrs[match[1]] = decodeXmlEntities(match[2]);
  }
  return attrs;
}

function tagText(block, tagName) {
  const re = new RegExp(String.raw`<${tagName}\b[^>]*>([\s\S]*?)<\/${tagName}>`);
  const match = re.exec(block);
  if (!match) return null;
  return decodeXmlEntities(match[1].trim());
}

function normalizeRegexText(value) {
  return value.replaceAll(/\s+/g, '');
}

function extractDigits(value) {
  return value.replaceAll(/\D/g, '');
}

function uniquePreserveOrder(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function parseNumberFormats(territoryBlock) {
  const availableFormats = /<availableFormats\b[^>]*>([\s\S]*?)<\/availableFormats>/.exec(territoryBlock)?.[1];
  if (!availableFormats) return [];

  const formats = [];
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
    const leadingDigits = [];
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

function collectExampleDigitsByType(territoryBlock) {
  const examplesByType = {};

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

function matchesLeadingDigits(number, leadingDigits) {
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

function formatNationalNumber(number, formats) {
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

function maskNationalNumber(nationalFormatted) {
  return nationalFormatted.replaceAll(/\d/g, '#').replaceAll(/\s+/g, ' ').trim();
}

function pushMaskForExample(countryCode, formats, exampleDigits, acc) {
  if (!exampleDigits) return;
  const formattedNational = formatNationalNumber(exampleDigits, formats);
  const maskedNational = maskNationalNumber(formattedNational);
  if (!maskedNational) return;
  acc.push(`+${countryCode} ${maskedNational}`.trim());
}

function buildRegionMasks(countryCode, formats, examplesByType) {
  const masks = [];

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

function parseTerritories(xml) {
  const territories = [];
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

function buildMainRegionByCode(territories) {
  const mainRegionByCode = new Map();

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

function getEffectiveFormats(territory, territoryById, mainRegionByCode) {
  if (territory.formats.length > 0) return territory.formats;

  const mainRegionId = mainRegionByCode.get(territory.countryCode);
  const mainRegion = mainRegionId ? territoryById.get(mainRegionId) : null;
  if (mainRegion && mainRegion.formats.length > 0) {
    return mainRegion.formats;
  }

  return territory.formats;
}

function buildMapping(territories, territoryById, mainRegionByCode) {
  const mapping = {};

  for (const territory of territories) {
    const effectiveFormats = getEffectiveFormats(territory, territoryById, mainRegionByCode);
    const masks = buildRegionMasks(territory.countryCode, effectiveFormats, territory.examplesByType);
    if (masks.length === 0) continue;
    mapping[territory.id] = masks.length === 1 ? masks[0] : masks;
  }

  return mapping;
}

function sortMappingByCountryCode(mapping) {
  const sortedEntries = Object.entries(mapping).sort((a, b) => a[0].localeCompare(b[0], 'en'));
  return Object.fromEntries(sortedEntries);
}

function parseMetadataXmlToMasks(xml) {
  const territories = parseTerritories(xml);
  const territoryById = new Map(territories.map((territory) => [territory.id, territory]));
  const mainRegionByCode = buildMainRegionByCode(territories);
  const mapping = buildMapping(territories, territoryById, mainRegionByCode);
  return sortMappingByCountryCode(mapping);
}

function parseMaskEntity(maskEntity) {
  const splitAt = maskEntity.indexOf(' ');
  if (splitAt === -1) {
    throw new Error(`Invalid mask entity, expected "<code> <mask>": ${maskEntity}`);
  }

  const code = maskEntity.slice(1, splitAt);
  const mask = maskEntity.slice(splitAt + 1);
  return { code, mask };
}

function encodeMaskToken(index) {
  const hi = Math.floor(index / TOKEN_BASE);
  const lo = index % TOKEN_BASE;
  if (hi >= TOKEN_BASE) {
    throw new Error(`Mask dictionary overflow: ${index} exceeds ${TOKEN_BASE * TOKEN_BASE - 1}`);
  }
  return `${TOKEN_ALPHABET[hi]}${TOKEN_ALPHABET[lo]}`;
}

function buildV2Data(mapping) {
  const countryEntries = Object.entries(mapping).sort((a, b) => a[0].localeCompare(b[0], 'en'));
  const maskFrequency = new Map();

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

  const maskIndex = new Map(masks.map((mask, idx) => [mask, idx]));
  const countries = {};

  for (const [country, maskEntity] of countryEntries) {
    const items = Array.isArray(maskEntity) ? maskEntity : [maskEntity];
    const parsed = items.map(parseMaskEntity);
    const code = parsed[0]?.code ?? '';
    if (!code) continue;
    if (parsed.some((entry) => entry.code !== code)) {
      throw new Error(`Mixed country codes in ${country}`);
    }

    const tokenStream = parsed
      .map((entry) => {
        const index = maskIndex.get(entry.mask);
        if (index === undefined) {
          throw new Error(`Mask not found in dictionary: ${entry.mask}`);
        }
        return encodeMaskToken(index);
      })
      .join('');

    countries[country] = `${code}|${tokenStream}`;
  }

  return { masks, countries };
}

function buildV3Data(mapping) {
  const countryEntries = Object.entries(mapping).sort((a, b) => a[0].localeCompare(b[0], 'en'));
  const maskFrequency = new Map();

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

  const maskIndex = new Map(masks.map((mask, idx) => [mask, idx]));
  const countries = {};

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

function escapeJsString(value) {
  return `'${value
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "\\'")
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r')
    .replaceAll('\t', '\\t')}'`;
}

function serializeJsKey(key) {
  return JS_IDENTIFIER_RE.test(key) ? key : escapeJsString(key);
}

function serializeJsValue(value) {
  if (typeof value === 'string') return escapeJsString(value);
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    return `[${value.map((item) => serializeJsValue(item)).join(',')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    return `{${entries
      .map(([key, item]) => `${serializeJsKey(key)}:${serializeJsValue(item)}`)
      .join(',')}}`;
  }

  throw new Error(`Unsupported value type for JS serialization: ${String(value)}`);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
    headers: {
      accept: 'application/vnd.github+json',
      'user-agent': 'desource-phone-mask-generator'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.json();
}

async function fetchArrayBuffer(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(60_000),
    headers: {
      'user-agent': 'desource-phone-mask-generator'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.arrayBuffer();
}

function writeOutputs(mapping) {
  const outDir = path.join(PACKAGE_ROOT, 'src');
  fs.mkdirSync(outDir, { recursive: true });

  const keys = Object.keys(mapping);
  const countryKeyUnion = keys.map((key) => `'${key}'`).join(' | ');
  const jsonPath = path.join(outDir, 'data.json');
  const minPath = path.join(outDir, 'data.min.js');
  const minV2Path = path.join(outDir, 'data.v2.min.js');
  const minV3Path = path.join(outDir, 'data.v3.min.js');
  const typesPath = path.join(outDir, 'data-types.ts');
  const v2 = buildV2Data(mapping);
  const v3 = buildV3Data(mapping);

  fs.writeFileSync(jsonPath, `${JSON.stringify(mapping, null, 2)}\n`, 'utf8');
  fs.writeFileSync(minPath, `export default ${serializeJsValue(mapping)};\n`, 'utf8');
  fs.writeFileSync(
    minV2Path,
    `export const masks = ${serializeJsValue(v2.masks)};\nexport const countries = ${serializeJsValue(v2.countries)};\n`,
    'utf8'
  );
  fs.writeFileSync(
    minV3Path,
    `export const masks = ${serializeJsValue(v3.masks)};\nexport const countries = ${serializeJsValue(v3.countries)};\n`,
    'utf8'
  );
  fs.writeFileSync(typesPath, `export type CountryKey = ${countryKeyUnion};\n`, 'utf8');

  console.info(`Wrote ${jsonPath}`);
  console.info(`Wrote ${minPath}`);
  console.info(`Wrote ${minV2Path}`);
  console.info(`Wrote ${minV3Path}`);
  console.info(`Wrote ${typesPath}`);
}

async function main() {
  const latestRelease = await fetchJson(GITHUB_RELEASE_LATEST_API);
  const tag = latestRelease?.tag_name;
  if (!tag || typeof tag !== 'string') {
    throw new Error('Failed to resolve latest libphonenumber release tag');
  }

  const archiveUrl = RELEASE_ARCHIVE_URL(tag);
  console.info(`Using libphonenumber release: ${tag}`);
  console.info(`Downloading: ${archiveUrl}`);

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
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
