/// <reference types="vitest/globals" />
import { PhoneInput, PMaskHelpers, phoneMaskAction, phoneMaskAttachment, usePhoneMask } from '../../src/index';

describe('svelte package index', () => {
  it('exports component, directives, composable and helper facade', () => {
    expect(PhoneInput).toBeDefined();
    expect(typeof phoneMaskAction).toBe('function');
    expect(typeof phoneMaskAttachment).toBe('function');
    expect(typeof usePhoneMask).toBe('function');

    expect(typeof PMaskHelpers.getFlagEmoji).toBe('function');
    expect(typeof PMaskHelpers.countPlaceholders).toBe('function');
    expect(typeof PMaskHelpers.formatDigitsWithMap).toBe('function');
    expect(typeof PMaskHelpers.pickMaskVariant).toBe('function');
    expect(typeof PMaskHelpers.removeCountryCodePrefix).toBe('function');
  });
});
