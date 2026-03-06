/// <reference types="vitest/globals" />
import { beforeEach, describe, expect, it } from 'vitest';
import { countryCodeEmoji } from '../../src/country-code-emodji';
import {
  getCountry,
  parseCountryCode,
  countPlaceholders,
  detectCountryFromLocale,
  filterCountries,
  formatDigitsWithMap,
  getNavigatorLang,
  hasCountry,
  pickMaskVariant,
  removeCountryCodePrefix,
  toArray
} from '../../src/utils';
import { getFlagEmoji } from '../../src/entries';
import type { MaskFull } from '../../src/entries';

const sampleCountries: MaskFull[] = [
  {
    id: 'US',
    code: '+1',
    mask: '###-###-####',
    name: 'United States',
    flag: countryCodeEmoji('US')
  },
  {
    id: 'DE',
    code: '+49',
    mask: '####-########',
    name: 'Germany',
    flag: countryCodeEmoji('DE')
  },
  {
    id: 'BR',
    code: '+55',
    mask: '## ########',
    name: 'Brazil',
    flag: countryCodeEmoji('BR')
  }
];

describe('locale helpers', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns browser language code with fallback', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(getNavigatorLang()).toBe('en-US');
  });

  it('falls back to "en" when navigator is unavailable', () => {
    vi.stubGlobal('navigator', undefined);
    expect(getNavigatorLang()).toBe('en');
  });

  it('detects country from locale', () => {
    vi.stubGlobal('navigator', { language: 'de-DE' });
    expect(detectCountryFromLocale()).toBe('DE');
  });

  it('falls back to split parsing for underscore locales', () => {
    vi.stubGlobal('navigator', { language: 'en_US' });
    expect(detectCountryFromLocale()).toBe('US');
  });

  it('returns null when locale has no region', () => {
    vi.stubGlobal('navigator', { language: 'en' });
    expect(detectCountryFromLocale()).toBeNull();
  });
});

describe('country helpers', () => {
  it('checks country existence against english map', () => {
    expect(hasCountry('US')).toBe(true);
    expect(hasCountry('ZZ')).toBe(false);
  });

  it('resolves country by id and locale with fallback', () => {
    const us = getCountry('us', 'en');
    const fallback = getCountry('ZZ', 'en');
    expect(us.id).toBe('US');
    expect(fallback.id).toBe('US');
    expect(fallback).toMatchObject({ code: us.code, mask: us.mask });
  });

  it('parses country code or fallback when invalid', () => {
    expect(parseCountryCode('us')).toBe('US');
    expect(parseCountryCode('ZZ', 'DE')).toBe('DE');
    expect(parseCountryCode(undefined, 'DE')).toBe('DE');
  });
});

describe('string and mask helpers', () => {
  it('normalizes input to an array', () => {
    expect(toArray('abc')).toEqual(['abc']);
    expect(toArray(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('counts placeholder characters', () => {
    expect(countPlaceholders('###-##-####')).toBe(9);
    expect(countPlaceholders('+1 ###')).toBe(3);
  });

  it('removes the country code prefix', () => {
    expect(removeCountryCodePrefix('+1 ###-###-####')).toBe('###-###-####');
    expect(removeCountryCodePrefix('###-###-####')).toBe('###-###-####');
  });

  it('picks best variant based on typed digits count', () => {
    expect(pickMaskVariant(['###-##', '#####-####'], 2)).toBe('###-##');
    expect(pickMaskVariant(['###-##', '#####-####'], 5)).toBe('###-##');
    expect(pickMaskVariant(['###-##', '#####-####'], 10)).toBe('#####-####');
  });

  it('formats digits and tracks digit map', () => {
    const result = formatDigitsWithMap('###-##-##', '12345');
    expect(result.display).toBe('123-45-');
    expect(result.map).toEqual([0, 1, 2, -1, 3, 4, -1]);
  });
});

describe('country list filtering', () => {
  it('returns all countries for empty search', () => {
    expect(filterCountries(sampleCountries, '   ')).toHaveLength(sampleCountries.length);
  });

  it('sorts and scores by match quality', () => {
    const results = filterCountries(sampleCountries, 'ger');
    expect(results.map((country) => country.id)).toEqual(['DE']);
  });

  it('supports numeric search against country code', () => {
    const results = filterCountries(sampleCountries, '+55');
    expect(results.map((country) => country.id)).toEqual(['BR']);
  });

  it('supports partial matching for name/id/code and sorts ties by name', () => {
    const byNameIncludes = filterCountries(sampleCountries, 'states');
    expect(byNameIncludes.map((country) => country.id)).toEqual(['US']);

    const byIdPrefix = filterCountries(sampleCountries, 'U');
    expect(byIdPrefix.map((country) => country.id)).toContain('US');

    const byNumericContains = filterCountries(sampleCountries, '9');
    expect(byNumericContains.map((country) => country.id)).toEqual(['DE']);

    const tieCountries: MaskFull[] = [
      {
        id: 'AC',
        code: '+10',
        mask: '###',
        name: 'Beta',
        flag: countryCodeEmoji('AC')
      },
      {
        id: 'AD',
        code: '+10',
        mask: '###',
        name: 'Alpha',
        flag: countryCodeEmoji('AD')
      }
    ];

    const tied = filterCountries(tieCountries, '+10');
    expect(tied.map((country) => country.name)).toEqual(['Alpha', 'Beta']);
  });
});

describe('country flags', () => {
  it('uses country emoji helpers', () => {
    expect(getFlagEmoji('US')).toBe(countryCodeEmoji('US'));
  });
});
