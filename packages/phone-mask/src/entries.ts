// @ts-expect-error -- Ignore import of JS file
import data from './data.min.js';
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
interface MaskGeoCache {
  country_code: string;
  ts: number;
}
type MaskBaseMap = Record<CountryKey, string | Array<string>>;
type MaskMap = Record<CountryKey, Omit<Mask, 'id'>>;
type MaskWithFlagMap = Record<CountryKey, Omit<MaskWithFlag, 'id'>>;
type MaskFullMap = Record<CountryKey, Omit<MaskFull, 'id'>>;

const dataEntries = Object.entries(data) as Array<[CountryKey, string | string[]]>;
const divideMask = (maskEntity: string) => maskEntity.split(/ (.*)/s);
function getCodeAndMask(maskEntity: string | Array<string>) {
  let code = '';
  let mask: string | Array<string> = '';
  if (Array.isArray(maskEntity)) {
    const masks: string[] = [];
    for (const item of maskEntity) {
      const [_code, _mask] = divideMask(item);
      if (!code) code = _code;
      masks.push(_mask);
    }
    mask = masks;
  } else {
    const [c, m] = divideMask(maskEntity);
    code = c;
    mask = m;
  }
  return [code, mask] as const;
}
/**
 * Base masks (including country code) map
 * @example
 * MasksBaseMap.US // "+1 ###-###-####"
 */
export const MasksBaseMap: MaskBaseMap = data;
/** Base masks (including country code) array
 * @example
 * MasksBase[0] // { id: 'US', mask: "+1 ###-###-####" }
 */
export const MasksBase = dataEntries.map<MaskBase>(([id, mask]) => ({ id, mask }));
/**
 * Masks map with country code as separate property
 * @example
 * MasksMap.US // { code: "+1", mask: "###-###-####" }
 */
export const MasksMap = dataEntries.reduce<MaskMap>((acc, [id, maskEntity]) => {
  const [code, mask] = getCodeAndMask(maskEntity);
  acc[id] = { code, mask };
  return acc;
}, {} as MaskMap);
/**
 * Masks array with country code as separate property
 * @example
 * Masks[0] // { id: 'US', code: "+1", mask: "###-###-####" }
 */
export const Masks = dataEntries.map<Mask>(([id, maskEntity]) => {
  const [code, mask] = getCodeAndMask(maskEntity);
  return { id, code, mask };
});
/**
 * Masks map with flag emoji
 * @example
 * MasksWithFlagMap.US // { code: "+1", mask: "###-###-####", flag: "🇺🇸" }
 */
export const MasksWithFlagMap = dataEntries.reduce<MaskWithFlagMap>((acc, [id, maskEntity]) => {
  const [code, mask] = getCodeAndMask(maskEntity);
  acc[id] = { code, mask, flag: countryCodeEmoji(id) };
  return acc;
}, {} as MaskWithFlagMap);
/**
 * Masks array with flag emoji
 * @example
 * MasksWithFlag[0] // { id: 'US', code: "+1", mask: "###-###-####", flag: "🇺🇸" }
 */
export const MasksWithFlag = dataEntries.map<MaskWithFlag>(([id, maskEntity]) => {
  const [code, mask] = getCodeAndMask(maskEntity);
  return { id, code, mask, flag: countryCodeEmoji(id) };
});
/**
 * Full masks map with name and flag emoji. Name is localized based on provided language.
 * @example
 * MasksFullMap.US // { code: "+1", mask: "###-###-####", name: "United States", flag: "🇺🇸" }
 */
export const MasksFullMap = (lang: string) => {
  const dn = new Intl.DisplayNames([lang], { type: 'region' });
  return dataEntries.reduce<MaskFullMap>((acc, [id, maskEntity]) => {
    const [code, mask] = getCodeAndMask(maskEntity);
    const name = dn.of(id) ?? '';
    acc[id] = { code, mask, name, flag: countryCodeEmoji(id) };
    return acc;
  }, {} as MaskFullMap);
};
/**
 * Full masks array with name and flag emoji. Name is localized based on provided language.
 * @example
 * MasksFull[0] // { id: 'US', code: "+1", mask: "###-###-####", name: "United States", flag: "🇺🇸" }
 */
export const MasksFull = (lang: string) => {
  const dn = new Intl.DisplayNames([lang], { type: 'region' });
  return dataEntries.map<MaskFull>(([id, maskEntity]) => {
    const [code, mask] = getCodeAndMask(maskEntity);
    return {
      id,
      code,
      mask,
      name: dn.of(id) ?? '',
      flag: countryCodeEmoji(id)
    };
  });
};
/**
 * Full masks map with name and flag emoji in English
 * @example
 * MasksFullMapEn.US // { code: "+1", mask: "###-###-####", name: "United States", flag: "🇺🇸" }
 */
export const MasksFullMapEn = dataEntries.reduce<MaskFullMap>((acc, [id, maskEntity]) => {
  const [code, mask] = getCodeAndMask(maskEntity);
  const dn = new Intl.DisplayNames(['en'], { type: 'region' });
  acc[id] = { code, mask, name: dn.of(id) ?? '', flag: countryCodeEmoji(id) };
  return acc;
}, {} as MaskFullMap);
/**
 * Full masks array with name and flag emoji in English
 * @example
 * MasksFullEn[0] // { id: 'US', code: "+1", mask: "###-###-####", name: "United States", flag: "🇺🇸" }
 */
export const MasksFullEn = dataEntries.map<MaskFull>(([id, maskEntity]) => {
  const [code, mask] = getCodeAndMask(maskEntity);
  const dn = new Intl.DisplayNames(['en'], { type: 'region' });
  return {
    id,
    code,
    mask,
    name: dn.of(id) ?? '',
    flag: countryCodeEmoji(id)
  };
});
/** Get flag emoji by country ISO code */
export const getFlagEmoji = countryCodeEmoji;

export type { CountryKey, MaskBaseMap, MaskBase, MaskMap, Mask, MaskWithFlagMap, MaskWithFlag, MaskFullMap, MaskFull, MaskGeoCache };
