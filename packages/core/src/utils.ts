import countries from './data.min.js';
import { MasksFull } from './entries.js';
import type { CountryKey, MaskFull } from './entries.js';

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

/** Check if a country exists in the mask data */
export function hasCountry(code: string): boolean {
  return code.toUpperCase() in countries;
}

/** Get country data by ISO code and locale with fallback to US */
export function getCountry(code: string, locale: string): MaskFull {
  let id = code.toUpperCase() as CountryKey;
  if (!(id in countries)) id = 'US';
  return MasksFull(locale).find((country) => country.id === id)!;
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
    } else if (output || (digitIndex < digitLength && maskTemplate.includes('#', i + 1))) {
      // Only add separator if we have output or will fill next placeholder
      output += char;
      map.push(-1);
    }
  }

  return { display: output, map };
}

/** Prefix matches receive twice the weight of substring matches */
function matchScore(value: string, query: string, weight: number): number {
  const index = value.indexOf(query);
  if (index < 0) return 0;
  return index === 0 ? weight * 2 : weight;
}

/** Filter and rank countries by a search query */
export function filterCountries(countries: MaskFull[], search: string): MaskFull[] {
  const q = search.trim().toUpperCase();

  if (!q) return countries;

  const digits = q.replace(/\D/g, '');
  const matches: { country: MaskFull; score: number }[] = [];

  countries.forEach((country) => {
    const id = country.id.toUpperCase();

    let score = matchScore(country.name.toUpperCase(), q, 500) + matchScore(country.code.toUpperCase(), q, 50);

    if (id.startsWith(q)) {
      score += id === q ? 200 : 150;
    }

    if (digits) {
      score += matchScore(country.code.replace(/\D/g, ''), digits, 40);
    }

    if (score) matches.push({ country, score });
  });

  return matches
    .sort((a, b) => b.score - a.score || a.country.name.localeCompare(b.country.name))
    .map((match) => match.country);
}
