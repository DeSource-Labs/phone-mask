// @ts-expect-error -- Ignore import of JS file
import countries, { masks } from './data.min.js';
import { countryCodeEmoji } from './country-code-emodji';
import type { CountryKey } from './data-types';

interface MaskBase {
  id: CountryKey;
  mask: Array<string>;
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
type MaskBaseMap = Record<CountryKey, Array<string>>;
type MaskMap = Record<CountryKey, Omit<Mask, 'id'>>;
type MaskWithFlagMap = Record<CountryKey, Omit<MaskWithFlag, 'id'>>;
type MaskFullMap = Record<CountryKey, Omit<MaskFull, 'id'>>;

const DEFAULT_LANG = 'en';
const MAX_DN_CACHE_SIZE = 10;
const dnCache = new Map<string, Intl.DisplayNames>();
const getDisplayNames = (lang: string): Intl.DisplayNames => {
  const key = lang.toLowerCase();
  const cached = dnCache.get(key);
  if (cached) return cached;
  const dn = new Intl.DisplayNames([lang], { type: 'region' });
  // Find and delete the first non-'en' key if cache size exceeds limit
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

const countryRows = Object.entries(countries) as Array<[CountryKey, string]>;

const MasksBaseMapValue = {} as MaskBaseMap;
const MasksMapValue = {} as MaskMap;
const MasksWithFlagMapValue = {} as MaskWithFlagMap;
const MasksBaseValue: MaskBase[] = [];
const MasksValue: Mask[] = [];
const MasksWithFlagValue: MaskWithFlag[] = [];

for (const [id, row] of countryRows) {
  const rowEntries = row.split('|');
  const code = `+${rowEntries[0]}`;
  const mask = rowEntries.slice(1).map<string>((index) => masks[Number(index)]);
  const flag = countryCodeEmoji(id);
  const baseMask = mask.map((item) => `${code} ${item}`);

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
 * MasksBaseMap.US // ["+1 ###-###-####"]
 */
export const MasksBaseMap: MaskBaseMap = MasksBaseMapValue;
/** Base masks (including country code) array
 * @example
 * MasksBase[0] // { id: 'US', mask: ["+1 ###-###-####"] }
 */
export const MasksBase = MasksBaseValue;
/**
 * Masks map with country code as separate property
 * @example
 * MasksMap.US // { code: "+1", mask: ["###-###-####"] }
 */
export const MasksMap = MasksMapValue;
/**
 * Masks array with country code as separate property
 * @example
 * Masks[0] // { id: 'US', code: "+1", mask: ["###-###-####"] }
 */
export const Masks = MasksValue;
/**
 * Masks map with flag emoji
 * @example
 * MasksWithFlagMap.US // { code: "+1", mask: ["###-###-####"], flag: "🇺🇸" }
 */
export const MasksWithFlagMap = MasksWithFlagMapValue;
/**
 * Masks array with flag emoji
 * @example
 * MasksWithFlag[0] // { id: 'US', code: "+1", mask: ["###-###-####"], flag: "🇺🇸" }
 */
export const MasksWithFlag = MasksWithFlagValue;
/**
 * Full masks map with name and flag emoji. Name is localized based on provided language.
 * @example
 * MasksFullMap.US // { code: "+1", mask: ["###-###-####"], name: "United States", flag: "🇺🇸" }
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
 * MasksFull[0] // { id: 'US', code: "+1", mask: ["###-###-####"], name: "United States", flag: "🇺🇸" }
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
 * MasksFullMapEn.US // { code: "+1", mask: ["###-###-####"], name: "United States", flag: "🇺🇸" }
 */
export const MasksFullMapEn = MasksFullMap(DEFAULT_LANG);
/**
 * Full masks array with name and flag emoji in English
 * @example
 * MasksFullEn[0] // { id: 'US', code: "+1", mask: ["###-###-####"], name: "United States", flag: "🇺🇸" }
 */
export const MasksFullEn = MasksFull(DEFAULT_LANG);
/** Get flag emoji by country ISO code */
export const getFlagEmoji = countryCodeEmoji;

export type { CountryKey, MaskBaseMap, MaskBase, MaskMap, Mask, MaskWithFlagMap, MaskWithFlag, MaskFullMap, MaskFull };
