/// <reference types="vitest/globals" />
import { describe, expect, it, vi } from 'vitest';
import { countryCodeEmoji } from '../../src/country-code-emodji';

describe('countryCodeEmoji', () => {
  it('converts a valid country code to a flag emoji', () => {
    expect(countryCodeEmoji('US')).toBe('🇺🇸');
  });

  it('falls back to 0 when codePointAt returns undefined', () => {
    const spy = vi.spyOn(String.prototype, 'codePointAt').mockReturnValue(undefined);
    try {
      expect(countryCodeEmoji('US')).toBe(String.fromCodePoint(127397, 127397));
    } finally {
      spy.mockRestore();
    }
  });

  it('throws for invalid country code input', () => {
    expect(() => countryCodeEmoji('USA')).toThrow(TypeError);
  });
});
