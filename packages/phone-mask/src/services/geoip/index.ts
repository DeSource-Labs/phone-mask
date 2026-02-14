/**
 * Detect country from GeoIP service.
 * Attempts to fetch country code from external API with timeout
 */
export async function detectCountryFromGeoIP(
  url = 'https://ipapi.co/json/',
  timeout = 1_500
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
