/**
 * Derive international phone masks from libphonenumber metadata (google-libphonenumber)
 * and output a JSON mapping of ISO alpha-2 -> mask or array of masks in the format:
 *   "US": "+1 (###)###-####"
 *   "CN": ["+86 (###)####-###", "+86 (###)####-####"]
 *
 * @see https://github.com/google/libphonenumber
 *
 * Notes and limitations:
 * - This script uses PhoneNumberUtil.getExampleNumberForType(...) to obtain example numbers
 *   for several phone number types (FIXED_LINE_OR_MOBILE, MOBILE, FIXED_LINE, TOLL_FREE, PREMIUM_RATE).
 *   For many countries this yields representative formatted numbers, which we convert into masks.
 * - The output masks preserve the leading "+<country code>" portion as literal digits and replace
 *   subsequent digits with "#" placeholders. Formatting characters (spaces, parentheses, hyphens)
 *   are kept.
 * - This is a heuristic; libphonenumber metadata is the canonical source for valid patterns and example
 *   numbers, but converting example numbers to masks may not capture all valid local formats.
 */

const fs = require('fs');
const path = require('path');
const { PhoneNumberUtil, PhoneNumberFormat, PhoneNumberType } = require('google-libphonenumber');

const phoneUtil = PhoneNumberUtil.getInstance();

const TYPES = [
  PhoneNumberType.FIXED_LINE_OR_MOBILE,
  PhoneNumberType.MOBILE,
  PhoneNumberType.FIXED_LINE,
  PhoneNumberType.TOLL_FREE,
  PhoneNumberType.PREMIUM_RATE,
  PhoneNumberType.SHARED_COST,
  PhoneNumberType.VOIP,
  PhoneNumberType.PERSONAL_NUMBER,
  PhoneNumberType.PAGER
];

function toMaskFromInternational(intlStr) {
  // Keep the leading +<country code digits> portion exactly as in the intlStr,
  // replace all other digits with '#', preserve punctuation and whitespace.
  if (!intlStr || typeof intlStr !== 'string') return null;

  // strip extension part if present (e.g., " ext " or " x")
  const noExt = intlStr.split(/(?: ext| x| ext\.)/i)[0].trim();

  // find leading '+' and the following digit run (country code)
  const match = noExt.match(/^\+(\d+)(.*)$/);
  if (!match) {
    // fallback: replace all digits with '#'
    return noExt.replace(/\d/g, '#');
  }
  const cc = match[1]; // digits after +
  const rest = match[2] || '';

  // If cc doesn't match provided countryCodeDigits, still keep parsed cc as-is (safe)
  const keptPrefix = `+${cc}`;

  // Replace digits in rest with '#'
  const maskedRest = rest.replace(/\d/g, '#');

  // Trim leading/trailing spaces to match typical mask formatting
  return (keptPrefix + maskedRest).trim();
}

function uniqPreserveOrder(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (x == null) continue;
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

function safeGetExample(region, type) {
  try {
    const ex = phoneUtil.getExampleNumberForType(region, type);
    return ex || null;
  } catch {
    // getExampleNumberForType may throw for some regions/types; ignore
    return null;
  }
}

function getRegionCountryCode(region) {
  try {
    return String(phoneUtil.getCountryCodeForRegion(region));
  } catch {
    return null;
  }
}

function normalizeRegion(region) {
  return String(region).trim().toUpperCase();
}

function generateMasksForRegion(region) {
  const masks = [];

  const countryCodeDigits = getRegionCountryCode(region);
  if (!countryCodeDigits) return masks;

  for (const t of TYPES) {
    const ex = safeGetExample(region, t);
    if (!ex) continue;
    try {
      const intl = phoneUtil.format(ex, PhoneNumberFormat.INTERNATIONAL);
      const mask = toMaskFromInternational(intl);

      if (mask) masks.push(mask);
    } catch {
      // ignore formatting errors
    }
  }

  // Try the national formatting for FIXED_LINE_OR_MOBILE as fallback
  try {
    const ex2 =
      safeGetExample(region, PhoneNumberType.FIXED_LINE_OR_MOBILE) || safeGetExample(region, PhoneNumberType.MOBILE);
    if (ex2) {
      const nat = phoneUtil.format(ex2, PhoneNumberFormat.INTERNATIONAL);
      const mask = toMaskFromInternational(nat);

      if (mask) masks.push(mask);
    }
  } catch {
    // ignore
  }

  // Deduplicate, prefer shorter canonical variants first
  const unique = uniqPreserveOrder(masks);

  // Map arrays of 1 to single string for readability
  return unique;
}

function main() {
  const supported = Array.from(phoneUtil.getSupportedRegions()).sort();
  const mapping = {};

  for (const regionRaw of supported) {
    const region = normalizeRegion(regionRaw);
    const masks = generateMasksForRegion(region);
    if (!masks || masks.length === 0) {
      // skip regions with no example numbers obtained
      continue;
    }
    // If the only masks are essentially identical, collapse to a single string
    const unique = uniqPreserveOrder(masks);
    if (unique.length === 1) mapping[region] = unique[0];
    else mapping[region] = unique;
  }

  // Write to src/data.json
  const outJson = JSON.stringify(mapping, null, 2);
  const outPath = path.resolve(process.cwd(), 'src', 'data.json');
  try {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, outJson, 'utf8');
    console.info(`Wrote ${outPath}`);
  } catch (err) {
    console.error(`Failed to write ${outPath}: ${err.message}`);
  }
  // Write to src/data.min.js (minified mapping as JS module: export default {...}; minifier should also be used)
  const outMinJs = `export default ${JSON.stringify(mapping)};\n`;
  const outMinPath = path.resolve(process.cwd(), 'src', 'data.min.js');
  try {
    fs.mkdirSync(path.dirname(outMinPath), { recursive: true });
    fs.writeFileSync(outMinPath, outMinJs, 'utf8');
    console.info(`Wrote ${outMinPath}`);
  } catch (err) {
    console.error(`Failed to write ${outMinPath}: ${err.message}`);
  }
  // Write TypeScript file with export type CountryKey = all keys of mapping
  const outTs = `export type CountryKey = ${Object.keys(mapping)
    .map((k) => `'${k}'`)
    .join(' | ')};\n`;
  const outTsPath = path.resolve(process.cwd(), 'src', 'data-types.ts');
  try {
    fs.mkdirSync(path.dirname(outTsPath), { recursive: true });
    fs.writeFileSync(outTsPath, outTs, 'utf8');
    console.info(`Wrote ${outTsPath}`);
  } catch (err) {
    console.error(`Failed to write ${outTsPath}: ${err.message}`);
  }
}

main();
