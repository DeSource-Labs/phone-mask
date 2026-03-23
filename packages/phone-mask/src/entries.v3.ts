// @ts-expect-error -- Ignore import of JS file
import { countries, masks } from './data.v3.min.js';
import { countryCodeEmoji } from './country-code-emodji';
import type { CountryKey } from './data-types';

interface MaskBase {
  id: CountryKey;
  mask: string | Array<string>;
}
interface Mask extends MaskBase {
  code: string;
}
interface MaskWithFlag extends Mask {
  flag: string;
}
interface MaskFull extends MaskWithFlag {
  name: string;
}
type MaskBaseMap = Record<CountryKey, string | Array<string>>;
type MaskMap = Record<CountryKey, Omit<Mask, 'id'>>;
type MaskWithFlagMap = Record<CountryKey, Omit<MaskWithFlag, 'id'>>;
type MaskFullMap = Record<CountryKey, Omit<MaskFull, 'id'>>;

type DecodedCountry = {
  code: string;
  mask: string | Array<string>;
};

const DEFAULT_LANG = 'en';
const MAX_DN_CACHE_SIZE = 10;
const dnCache = new Map<string, Intl.DisplayNames>();
const getDisplayNames = (lang: string): Intl.DisplayNames => {
  const key = lang.toLowerCase();
  const cached = dnCache.get(key);
  if (cached) return cached;
  const dn = new Intl.DisplayNames([lang], { type: 'region' });
  if (dnCache.size >= MAX_DN_CACHE_SIZE) {
    for (const cacheKey of dnCache.keys()) {
      if (cacheKey !== DEFAULT_LANG) {
        dnCache.delete(cacheKey);
        break;
      }
    }
  }
  dnCache.set(key, dn);
  return dn;
};

function decodeCountryRow(row: string): DecodedCountry {
  const dividerIndex = row.indexOf('|');
  if (dividerIndex === -1) {
    throw new Error(`Invalid country row format in data.v3.min.js: "${row}"`);
  }

  const codeDigits = row.slice(0, dividerIndex);
  const indexesPart = row.slice(dividerIndex + 1);
  if (!indexesPart) {
    throw new Error(`Missing mask index stream in data.v3.min.js row: "${row}"`);
  }

  const decodedMasks: string[] = [];
  let start = 0;
  for (let i = 0; i <= indexesPart.length; i++) {
    if (i !== indexesPart.length && indexesPart.charCodeAt(i) !== 124) continue;

    const indexText = indexesPart.slice(start, i);
    if (!indexText) {
      throw new Error(`Invalid empty mask index in data.v3.min.js row: "${row}"`);
    }

    const maskIndex = Number(indexText);
    if (!Number.isInteger(maskIndex) || maskIndex < 0) {
      throw new Error(`Invalid mask index "${indexText}" in data.v3.min.js row: "${row}"`);
    }

    const mask = masks[maskIndex];
    if (!mask) {
      throw new Error(`Mask index "${maskIndex}" is missing in data.v3.min.js`);
    }

    decodedMasks.push(mask);
    start = i + 1;
  }

  const code = `+${codeDigits}`;
  return {
    code,
    mask: decodedMasks.length === 1 ? decodedMasks[0] : decodedMasks
  };
}

const countryRows = Object.entries(countries) as Array<[CountryKey, string]>;

const MasksBaseMapValue = {} as MaskBaseMap;
const MasksMapValue = {} as MaskMap;
const MasksWithFlagMapValue = {} as MaskWithFlagMap;
const MasksBaseValue: MaskBase[] = [];
const MasksValue: Mask[] = [];
const MasksWithFlagValue: MaskWithFlag[] = [];

for (const [id, row] of countryRows) {
  const { code, mask } = decodeCountryRow(row);
  const flag = countryCodeEmoji(id);
  const baseMask = Array.isArray(mask) ? mask.map((item) => `${code} ${item}`) : `${code} ${mask}`;

  MasksBaseMapValue[id] = baseMask;
  MasksMapValue[id] = { code, mask };
  MasksWithFlagMapValue[id] = { code, mask, flag };

  MasksBaseValue.push({ id, mask: baseMask });
  MasksValue.push({ id, code, mask });
  MasksWithFlagValue.push({ id, code, mask, flag });
}

/**
 * Base masks (including country code) map
 * @example
 * MasksBaseMap.US // "+1 ###-###-####"
 */
export const MasksBaseMap: MaskBaseMap = MasksBaseMapValue;
/** Base masks (including country code) array
 * @example
 * MasksBase[0] // { id: 'US', mask: "+1 ###-###-####" }
 */
export const MasksBase = MasksBaseValue;
/**
 * Masks map with country code as separate property
 * @example
 * MasksMap.US // { code: "+1", mask: "###-###-####" }
 */
export const MasksMap = MasksMapValue;
/**
 * Masks array with country code as separate property
 * @example
 * Masks[0] // { id: 'US', code: "+1", mask: "###-###-####" }
 */
export const Masks = MasksValue;
/**
 * Masks map with flag emoji
 * @example
 * MasksWithFlagMap.US // { code: "+1", mask: "###-###-####", flag: "🇺🇸" }
 */
export const MasksWithFlagMap = MasksWithFlagMapValue;
/**
 * Masks array with flag emoji
 * @example
 * MasksWithFlag[0] // { id: 'US', code: "+1", mask: "###-###-####", flag: "🇺🇸" }
 */
export const MasksWithFlag = MasksWithFlagValue;
/**
 * Full masks map with name and flag emoji. Name is localized based on provided language.
 * @example
 * MasksFullMap.US // { code: "+1", mask: "###-###-####", name: "United States", flag: "🇺🇸" }
 */
export const MasksFullMap = (lang: string) => {
  const dn = getDisplayNames(lang);
  return MasksWithFlag.reduce<MaskFullMap>((acc, entry) => {
    acc[entry.id] = {
      code: entry.code,
      mask: entry.mask,
      flag: entry.flag,
      name: dn.of(entry.id) ?? ''
    };
    return acc;
  }, {} as MaskFullMap);
};
/**
 * Full masks array with name and flag emoji. Name is localized based on provided language.
 * @example
 * MasksFull[0] // { id: 'US', code: "+1", mask: "###-###-####", name: "United States", flag: "🇺🇸" }
 */
export const MasksFull = (lang: string) => {
  const dn = getDisplayNames(lang);
  return MasksWithFlag.map<MaskFull>((entry) => ({
    id: entry.id,
    code: entry.code,
    mask: entry.mask,
    flag: entry.flag,
    name: dn.of(entry.id) ?? ''
  }));
};
/**
 * Full masks map with name and flag emoji in English
 * @example
 * MasksFullMapEn.US // { code: "+1", mask: "###-###-####", name: "United States", flag: "🇺🇸" }
 */
export const MasksFullMapEn = MasksFullMap(DEFAULT_LANG);
/**
 * Full masks array with name and flag emoji in English
 * @example
 * MasksFullEn[0] // { id: 'US', code: "+1", mask: "###-###-####", name: "United States", flag: "🇺🇸" }
 */
export const MasksFullEn = MasksFull(DEFAULT_LANG);
/** Get flag emoji by country ISO code */
export const getFlagEmoji = countryCodeEmoji;

export type { CountryKey, MaskBaseMap, MaskBase, MaskMap, Mask, MaskWithFlagMap, MaskWithFlag, MaskFullMap, MaskFull };
