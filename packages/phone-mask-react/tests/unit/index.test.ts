/// <reference types="vitest/globals" />
import { PhoneInput, PMaskHelpers } from '../../src/index';

describe('react package index', () => {
  it('exports public component and helper facade', () => {
    expect(PhoneInput).toBeDefined();
    expect(typeof PMaskHelpers.getFlagEmoji).toBe('function');
    expect(typeof PMaskHelpers.countPlaceholders).toBe('function');
    expect(typeof PMaskHelpers.formatDigitsWithMap).toBe('function');
    expect(typeof PMaskHelpers.pickMaskVariant).toBe('function');
    expect(typeof PMaskHelpers.removeCountryCodePrefix).toBe('function');
  });
});
