/// <reference types="vitest/globals" />
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CACHE_EXPIRY_MS, CACHE_KEY } from '../../src/services/geoip/consts';
import { detectByGeoIp, detectCountryFromGeoIP } from '../../src/services/geoip';

function createMockStorage() {
  const store = new Map<string, string>();

  return {
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => {
      return store.has(key) ? store.get(key) ?? null : null;
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    key: (index: number) => {
      return Array.from(store.keys())[index] ?? null;
    },
    get length() {
      return store.size;
    }
  } as Storage;
}

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.stubGlobal('localStorage', createMockStorage());
});

describe('detectCountryFromGeoIP', () => {
  it('normalizes country from country_code field', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ country_code: 'ca' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const code = await detectCountryFromGeoIP('https://example.com/geo', 2000);
    expect(code).toBe('CA');
  });

  it('parses country_code2 and passes request options', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ country_code2: 'de' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const code = await detectCountryFromGeoIP('https://example.com/geo', 2000);
    expect(code).toBe('DE');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/geo',
      expect.objectContaining({
        headers: { Accept: 'application/json' },
        signal: expect.any(AbortSignal)
      })
    );
  });

  it('returns null on failed response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    expect(await detectCountryFromGeoIP('https://example.com/geo')).toBeNull();
  });
});

describe('detectByGeoIp', () => {
  it('uses valid cached value before network call', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    localStorage.setItem(CACHE_KEY, JSON.stringify({ country_code: 'US', ts: Date.now() - 1_000 }));
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    expect(await detectByGeoIp()).toBe('US');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refreshes when cache is stale and updates localStorage', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    localStorage.setItem(CACHE_KEY, JSON.stringify({ country_code: 'US', ts: Date.now() - CACHE_EXPIRY_MS - 1 }));

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ country_code: 'br' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const code = await detectByGeoIp();
    expect(code).toBe('BR');
    expect(localStorage.getItem(CACHE_KEY)).toContain('BR');
  });

  it('ignores broken cached payload and falls back to remote lookup', async () => {
    localStorage.setItem(CACHE_KEY, 'not-json');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ country: 'es' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    expect(await detectByGeoIp()).toBe('ES');
  });

  it('returns null when request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    expect(await detectByGeoIp()).toBeNull();
  });
});
