/// <reference types="vitest/globals" />
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CountryKey, MaskFull } from '../../src/entries';

const country: MaskFull = {
  id: 'XX' as CountryKey,
  code: '+9',
  name: 'Testland',
  flag: '🏳️',
  mask: '###'
};

afterEach(() => {
  vi.doUnmock('../../src/utils');
  vi.resetModules();
});

describe('createPhoneFormatter:getCaretPosition branch paths', () => {
  it('returns display index when map contains the requested digit index', async () => {
    vi.doMock('../../src/utils', () => ({
      toArray: (value: string | string[]) => (Array.isArray(value) ? value : [value]),
      countPlaceholders: (mask: string) => mask.replace(/[^#]/g, '').length,
      removeCountryCodePrefix: (mask: string) => mask,
      pickMaskVariant: (variants: string[]) => variants[0],
      formatDigitsWithMap: () => ({ display: 'abc', map: [0, 2, 3] })
    }));

    const { createPhoneFormatter } = await import('../../src/formatter');
    const formatter = createPhoneFormatter(country);

    expect(formatter.getCaretPosition(2)).toBe(1);
  });

  it('returns first index whose mapped digit is greater than requested index', async () => {
    vi.doMock('../../src/utils', () => ({
      toArray: (value: string | string[]) => (Array.isArray(value) ? value : [value]),
      countPlaceholders: (mask: string) => mask.replace(/[^#]/g, '').length,
      removeCountryCodePrefix: (mask: string) => mask,
      pickMaskVariant: (variants: string[]) => variants[0],
      formatDigitsWithMap: () => ({ display: 'abc', map: [0, 2, 3] })
    }));

    const { createPhoneFormatter } = await import('../../src/formatter');
    const formatter = createPhoneFormatter(country);

    expect(formatter.getCaretPosition(1)).toBe(1);
  });
});
