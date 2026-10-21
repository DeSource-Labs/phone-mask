/// <reference types="vitest/globals" />
import { describe, expect, it, vi } from 'vitest';
import { getFlagEmoji, ccToEmoji } from '@src/country-code-emodji';

describe('countryCodeEmoji', () => {
  it('converts a valid country code to a flag emoji', () => {
    expect(getFlagEmoji('US')).toBe('🇺🇸');
    expect(ccToEmoji('US')).toBe('🇺🇸');
  });

  it('getFlagEmoji: falls back to 0 when codePointAt returns undefined', () => {
    const spy = vi.spyOn(String.prototype, 'codePointAt').mockReturnValue(undefined);
    try {
      expect(getFlagEmoji('US')).toBe(String.fromCodePoint(127397, 127397));
    } finally {
      spy.mockRestore();
    }
  });

  it('getFlagEmoji: throws for invalid country code input', () => {
    expect(() => getFlagEmoji('USA')).toThrow(TypeError);
    expect(() => getFlagEmoji('')).toThrow(TypeError);
    expect(() => getFlagEmoji(undefined as unknown as string)).toThrow(TypeError);
    expect(() => getFlagEmoji(null as unknown as string)).toThrow(TypeError);
    expect(() => getFlagEmoji({} as unknown as string)).toThrow(TypeError);
    expect(() => getFlagEmoji(123 as unknown as string)).toThrow(TypeError);
  });

  it('ccToEmoji: does not throw for invalid country code input', () => {
    expect(() => ccToEmoji('USA')).not.toThrow(TypeError);
    expect(ccToEmoji('USA')).toBe('🇺🇸');
  });

  it('ccToEmoji: throws for empty or short country code input', () => {
    expect(() => ccToEmoji('')).toThrow(RangeError);
    expect(() => ccToEmoji('U')).toThrow(RangeError);
    expect(() => ccToEmoji(undefined as unknown as string)).toThrow(TypeError);
    expect(() => ccToEmoji(null as unknown as string)).toThrow(TypeError);
    expect(() => ccToEmoji({} as unknown as string)).toThrow(TypeError);
    expect(() => ccToEmoji(123 as unknown as string)).toThrow(TypeError);
  });
});
