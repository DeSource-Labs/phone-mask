/// <reference types="vitest/globals" />
import { PhoneInput, phoneMaskAction, phoneMaskAttachment, usePhoneMask } from '../../src/index';
import * as core from '../../src/core';

describe('svelte package index', () => {
  it('exports component, directives, composable and no root helper facade', async () => {
    expect(PhoneInput).toBeDefined();
    expect(typeof phoneMaskAction).toBe('function');
    expect(typeof phoneMaskAttachment).toBe('function');
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
