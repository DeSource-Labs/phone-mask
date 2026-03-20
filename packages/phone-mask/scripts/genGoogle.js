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

const GITHUB_RELEASE_LATEST_API = 'https://api.github.com/repos/google/libphonenumber/releases/latest';
const RELEASE_ARCHIVE_URL = (tag) => `https://github.com/google/libphonenumber/archive/refs/tags/${tag}.tar.gz`;
const METADATA_PATH_SUFFIX = '/resources/PhoneNumberMetadata.xml';

const EXAMPLE_TYPES = [
  'fixedLineOrMobile',
  'mobile',
  'fixedLine',
  'tollFree',
  'premiumRate',
  'sharedCost',
  'voip',
  'personalNumber',
  'pager',
  'uan',
  'voicemail'
];

function readNullTerminatedAscii(buffer) {
  const index = buffer.indexOf(0);
  const end = index === -1 ? buffer.length : index;
  return buffer.subarray(0, end).toString('utf8');
}

function parseTarOctal(octalStr) {
  const clean = octalStr.replace(/\0/g, '').trim();
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

  throw new Error(`Failed to locate file in archive: *${filePathSuffix}`);
}

function decodeXmlEntities(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
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
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`);
  const match = re.exec(block);
  if (!match) return null;
  return decodeXmlEntities(match[1].trim());
}

function normalizeRegexText(value) {
  return value.replace(/\s+/g, '');
}

function extractDigits(value) {
  return value.replace(/\D/g, '');
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

function collectExampleDigits(territoryBlock) {
  const examples = [];

  for (const typeName of EXAMPLE_TYPES) {
    const sectionRe = new RegExp(`<${typeName}\\b[^>]*>([\\s\\S]*?)<\\/${typeName}>`);
    const sectionMatch = sectionRe.exec(territoryBlock);
    if (!sectionMatch) continue;

    const example = tagText(sectionMatch[1], 'exampleNumber');
    if (!example) continue;

    const digits = extractDigits(example);
    if (digits) examples.push(digits);
  }

  return uniquePreserveOrder(examples);
}

function matchesLeadingDigits(number, leadingDigits) {
  if (!leadingDigits || leadingDigits.length === 0) return true;

  for (const ld of leadingDigits) {
    try {
      const re = new RegExp(`^(?:${ld})`);
      if (re.test(number)) return true;
    } catch {
      // Ignore malformed leading-digits regex entries.
    }
  }

  return false;
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

    const replacement = entry.intlFormat && entry.intlFormat !== 'NA' ? entry.intlFormat : entry.format;
    if (!replacement || replacement === 'NA') continue;

    return number.replace(patternRe, replacement).trim();
  }

  return number;
}

function maskNationalNumber(nationalFormatted) {
  return nationalFormatted.replace(/\d/g, '#').replace(/\s+/g, ' ').trim();
}

function buildRegionMasks(countryCode, formats, examples) {
  const masks = [];

  for (const exampleDigits of examples) {
    const formattedNational = formatNationalNumber(exampleDigits, formats);
    const maskedNational = maskNationalNumber(formattedNational);
    if (!maskedNational) continue;

    masks.push(`+${countryCode} ${maskedNational}`.trim());
  }

  return uniquePreserveOrder(masks);
}

function parseMetadataXmlToMasks(xml) {
  const mapping = {};
  const territoryRe = /<territory\b([^>]*)>([\s\S]*?)<\/territory>/g;

  for (const match of xml.matchAll(territoryRe)) {
    const attrs = parseAttributes(match[1]);
    const territoryBlock = match[2];
    const id = (attrs.id || '').trim().toUpperCase();
    const countryCode = (attrs.countryCode || '').trim();

    if (!/^[A-Z]{2}$/.test(id)) continue;
    if (!/^\d+$/.test(countryCode)) continue;

    const formats = parseNumberFormats(territoryBlock);
    const examples = collectExampleDigits(territoryBlock);
    if (examples.length === 0) continue;

    const masks = buildRegionMasks(countryCode, formats, examples);
    if (masks.length === 0) continue;

    mapping[id] = masks.length === 1 ? masks[0] : masks;
  }

  const sortedEntries = Object.entries(mapping).sort((a, b) => a[0].localeCompare(b[0], 'en'));
  return Object.fromEntries(sortedEntries);
}

async function fetchJson(url) {
  const response = await fetch(url, {
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
  const outDir = path.resolve(process.cwd(), 'src');
  fs.mkdirSync(outDir, { recursive: true });

  const keys = Object.keys(mapping);
  const jsonPath = path.join(outDir, 'data.json');
  const minPath = path.join(outDir, 'data.min.js');
  const typesPath = path.join(outDir, 'data-types.ts');

  fs.writeFileSync(jsonPath, `${JSON.stringify(mapping, null, 2)}\n`, 'utf8');
  fs.writeFileSync(minPath, `export default ${JSON.stringify(mapping)};\n`, 'utf8');
  fs.writeFileSync(typesPath, `export type CountryKey = ${keys.map((key) => `'${key}'`).join(' | ')};\n`, 'utf8');

  console.info(`Wrote ${jsonPath}`);
  console.info(`Wrote ${minPath}`);
  console.info(`Wrote ${typesPath}`);
}

async function main() {
  // const latestRelease = await fetchJson(GITHUB_RELEASE_LATEST_API);
  const tag = 'v9.0.22'; // latestRelease?.tag_name;
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
