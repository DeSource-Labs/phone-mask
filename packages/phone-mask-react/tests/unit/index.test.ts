/// <reference types="vitest/globals" />
import { PhoneInput, usePhoneMask } from '../../src/index';
import * as core from '../../src/core';

describe('react package index', () => {
  it('exports public component without root helper facade', async () => {
    expect(PhoneInput).toBeDefined();
    expect(typeof usePhoneMask).toBe('function');
  });

  it('re-exports core utilities from dedicated core subpath', () => {
    expect(typeof core.getFlagEmoji).toBe('function');
    expect(typeof core.countPlaceholders).toBe('function');
    expect(typeof core.formatDigitsWithMap).toBe('function');
    expect(typeof core.pickMaskVariant).toBe('function');
    expect(typeof core.removeCountryCodePrefix).toBe('function');
  });
});
