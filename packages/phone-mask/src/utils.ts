import { CACHE_KEY, CACHE_EXPIRY_MS } from './consts'
import { MasksFullMap, MasksFullMapEn } from './entries';
import { detectCountryFromGeoIP } from './services';
import type { CountryKey, MaskFull, MaskGeoCache } from './entries';

export type FormatResult = {
  display: string;
  map: number[];
};

/** Get navigator language with fallback to 'en' */
export function getNavigatorLang(): string {
  return typeof navigator !== 'undefined' ? navigator.language || 'en' : 'en';
}

/** Get country data by ISO code and locale with fallback to US */
export function getCountry(code: string, locale: string): MaskFull {
  const isEn = locale.toLowerCase().startsWith('en');
  const map = isEn ? MasksFullMapEn : MasksFullMap(locale);
  const id = code.toUpperCase() as CountryKey;

  if (id in map) {
    return { id, ...map[id] };
  } else {
    return { id: 'US', ...map.US };
  }
}

export async function detectByGeoIp(
  hasCountry: (code: string) => boolean,
): Promise<CountryKey | null> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: MaskGeoCache = JSON.parse(cached);
      const expired = Date.now() - parsed.ts > CACHE_EXPIRY_MS;

      if (!expired && parsed.country_code && hasCountry(parsed.country_code)) {
        return parsed.country_code.toUpperCase() as CountryKey;
      }

      if (expired) localStorage.removeItem(CACHE_KEY);
    }
  } catch { /* ignore */ }

  // Fetch from GeoIP API
  const code = await detectCountryFromGeoIP();

  if (code && hasCountry(code)) {
    // Cache the result
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ country_code: code, ts: Date.now() } as MaskGeoCache));
    } catch {
      // Silent fail for localStorage issues
    }

    return code as CountryKey;
  }

  return null;
};

/** Ensure mask is an array of strings */
export function toArray<T>(mask: T | T[]): T[] {
  return Array.isArray(mask) ? mask : [mask];
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
  if (variants.length === 1) return variants[0]!;

  const withCounts = variants.map((m) => ({
    mask: m,
    count: countPlaceholders(m)
  }));

  // Find the smallest mask that can accommodate the typed digits
  const candidates = withCounts.filter((v) => v.count >= typedDigitsCount).sort((a, b) => a.count - b.count);

  if (candidates.length > 0) return candidates[0]!.mask;

  // If no mask is large enough, return the largest available
  const fallback = withCounts.sort((a, b) => b.count - a.count)[0];
  return fallback ? fallback.mask : variants[0]!;
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
      const nextHashIndex = maskTemplate.indexOf('#', i + 1);
      const hasMoreDigits = digitIndex < digitLength;
      const willFillNext = nextHashIndex !== -1 && hasMoreDigits;

      if (output.length > 0 || willFillNext) {
        output += char;
        map.push(-1);
      }
    }
  }

  return { display: output, map };
}
