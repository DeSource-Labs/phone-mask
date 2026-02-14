import { GEO_IP_API_URL, GEO_IP_TIMEOUT_MS, CACHE_KEY, CACHE_EXPIRY_MS } from './consts';

import type { MaskGeoCache } from './types';

/**
 * Detect country from GeoIP service.
 * Attempts to fetch country code from external API with timeout
 */
export async function detectCountryFromGeoIP(
  url = GEO_IP_API_URL,
  timeout = GEO_IP_TIMEOUT_MS
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const json = await res.json();
    const code = (json.country || json.country_code || json.countryCode || json.country_code2 || '')
      .toString()
      .toUpperCase();

    return code || null;
  } catch {
    return null;
  }
}

export async function detectByGeoIp(
  hasCountry: (code: string) => boolean,
): Promise<string | null> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: MaskGeoCache = JSON.parse(cached);
      const expired = Date.now() - parsed.ts > CACHE_EXPIRY_MS;

      if (!expired && parsed.country_code && hasCountry(parsed.country_code)) {
        return parsed.country_code.toUpperCase();
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

    return code;
  }

  return null;
}
