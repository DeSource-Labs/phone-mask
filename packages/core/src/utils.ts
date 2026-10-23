import { MasksFullMap, MasksFullMapEn } from './entries';
import type { CountryKey, MaskFull } from './entries';

export type FormatResult = {
  display: string;
  map: number[];
};

/** Get navigator language with fallback to 'en' */
export function getNavigatorLang(): string {
  return globalThis.navigator?.language || 'en';
}

/** Detect country from browser locale */
export function detectCountryFromLocale(): string | null {
  try {
    const lang = getNavigatorLang();

    try {
      const loc = new Intl.Locale(lang);
      if (loc.region) return loc.region.toUpperCase();
    } catch {
      // Ignore
    }

    const parts = lang.split(/[-_]/);
    if (parts.length > 1) return parts[1]?.toUpperCase() || null;
  } catch {
    // Ignore
  }

  return null;
}

/** Check if a country exists in the full mask map */
export function hasCountry(code: string): boolean {
  const map = MasksFullMapEn;
  const id = code.toUpperCase() as CountryKey;

  return id in map;
}

/** Get country data by ISO code and locale with fallback to US */
export function getCountry(code: string, locale: string): MaskFull {
  const map = MasksFullMap(locale);
  let id = code.toUpperCase() as CountryKey;
  if (!(id in map)) id = 'US';
  return { id, ...map[id] };
}

export function parseCountryCode(code?: string | null, fallback?: string): string {
  return !!code && hasCountry(code) ? code.toUpperCase() : fallback || '';
}

/** Count number of placeholders (#) in a mask string */
export function countPlaceholders(maskStr: string): number {
  return (maskStr.match(/#/g) || []).length;
}

/** Remove country code prefix (e.g., +1 ) from a mask string */
export function removeCountryCodePrefix(maskStr: string): string {
  return maskStr.replace(/^\+\d+\s?/, '');
}

/** Pick the most suitable mask variant based on typed digits count */
export function pickMaskVariant(variants: string[], typedDigitsCount: number): string {
  if (!variants.length) return '';
  if (variants.length === 1) return variants[0];

  const withCounts = variants.map((m) => ({
    mask: m,
    count: countPlaceholders(m)
  }));

  // Find the smallest mask that can accommodate the typed digits
  const candidates = withCounts.filter((v) => v.count >= typedDigitsCount).sort((a, b) => a.count - b.count);

  if (candidates.length > 0) return candidates[0].mask;

  // If no mask is large enough, return the largest available
  const fallback = withCounts.sort((a, b) => b.count - a.count)[0];
  return fallback ? fallback.mask : variants[0];
}

/** Formatting with mapping for efficient position tracking */
export function formatDigitsWithMap(maskTemplate: string, digitStr: string): FormatResult {
  let output = '';
  const map: number[] = [];
  let digitIndex = 0;
  const digitLength = digitStr.length;
  const templateLength = maskTemplate.length;

  for (let i = 0; i < templateLength; i++) {
    const char = maskTemplate[i];

    if (char === '#') {
      if (digitIndex < digitLength) {
        output += digitStr[digitIndex];
        map.push(digitIndex);
        digitIndex++;
      } else {
        break; // No more digits to insert
      }
    } else {
      // Only add separator if we have output or will fill next placeholder
      if (output || (digitIndex < digitLength && maskTemplate.indexOf('#', i + 1) !== -1)) {
        output += char;
        map.push(-1);
      }
    }
  }

  return { display: output, map };
}

/** Filter and rank countries by a search query */
export function filterCountries(countries: MaskFull[], search: string): MaskFull[] {
  const q = search.trim().toUpperCase();

  if (!q) return countries;

  const qDigits = q.replace(/\D/g, '');
  const isNumeric = qDigits.length > 0;

  return countries
    .map((c) => {
      const nameUpper = c.name.toUpperCase();
      const idUpper = c.id.toUpperCase();
      const codeUpper = c.code.toUpperCase();
      const codeDigits = c.code.replace(/\D/g, '');

      let score = 0;
      if (nameUpper.startsWith(q)) score = 1000;
      else if (nameUpper.includes(q)) score = 500;

      if (codeUpper.startsWith(q)) score += 100;
      else if (codeUpper.includes(q)) score += 50;

      if (idUpper === q) score += 200;
      else if (idUpper.startsWith(q)) score += 150;

      if (isNumeric && codeDigits.startsWith(qDigits)) score += 80;
      else if (isNumeric && codeDigits.includes(qDigits)) score += 40;

      return { country: c, score };
    })
    .filter((x) => x.score)
    .sort((a, b) => b.score - a.score || a.country.name.localeCompare(b.country.name))
    .map((x) => x.country);
}
