/// <reference types="vitest/globals" />
import { describe, expect, it, vi } from 'vitest';
import { countryCodeEmoji } from '../../src/country-code-emodji';
import { MasksFull, MasksFullMap } from '../../src/entries';

describe('entries helpers', () => {
  it('throws for invalid country code inputs', () => {
    expect(() => countryCodeEmoji('USA')).toThrow(TypeError);
    expect(() => countryCodeEmoji(123 as unknown as string)).toThrow(TypeError);
  });

  it('handles display names cache growth and keeps producing maps', () => {
    const locales = ['de', 'fr', 'es', 'it', 'pt', 'ru', 'uk', 'ar', 'zh', 'ja', 'ko', 'tr'];

    for (const locale of locales) {
      const map = MasksFullMap(locale);
      expect(map.US).toBeDefined();
    }

    // Calling a previously used locale after cache pressure should still work.
    expect(MasksFullMap('en').US.name).toBeTruthy();
    expect(MasksFullMap('de').US.name).toBeTruthy();
  });

  it('falls back to empty names when Intl.DisplayNames returns undefined', () => {
    const displayNamesSpy = vi.spyOn(Intl, 'DisplayNames').mockImplementation(function MockDisplayNames(
      this: Intl.DisplayNames
    ) {
      return {
        of: () => undefined
      } as Intl.DisplayNames;
    } as unknown as typeof Intl.DisplayNames);

    try {
      const map = MasksFullMap('x-coverage-fallback');
      const arr = MasksFull('x-coverage-fallback-arr');

      expect(map.US.name).toBe('');
      expect(arr.find((country) => country.id === 'US')?.name).toBe('');
    } finally {
      displayNamesSpy.mockRestore();
    }
  });
});
