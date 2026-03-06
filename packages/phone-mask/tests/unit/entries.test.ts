/// <reference types="vitest/globals" />
import { describe, expect, it } from 'vitest';
import { countryCodeEmoji } from '../../src/country-code-emodji';
import { MasksFullMap } from '../../src/entries';

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
});
