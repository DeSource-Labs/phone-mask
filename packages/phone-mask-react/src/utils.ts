// Shared phone formatting utilities
import {
  toArray,
  countPlaceholders,
  removeCountryCodePrefix,
  pickMaskVariant,
  formatDigitsWithMap,
  type MaskFull
} from '@desource/phone-mask';
import type { FormatterHelpers } from './types';

export function createPhoneFormatter(country: MaskFull): FormatterHelpers {
  const variants = toArray(country.mask);
  const variantsDigits = variants.map((m) => countPlaceholders(removeCountryCodePrefix(m)));
  const maxDigits = Math.max(...variantsDigits);

  const getMask = (digitLength: number) => {
    const mask = pickMaskVariant(variants, digitLength);
    return removeCountryCodePrefix(mask);
  };

  return {
    formatDisplay: (digits: string) => {
      const template = getMask(digits.length);
      return formatDigitsWithMap(template, digits).display;
    },

    getMaxDigits: () => maxDigits,

    getPlaceholder: () => {
      // Always use minimal mask as a placeholder
      const template = getMask(0);
      return template;
    },

    getCaretPosition: (digitIndex: number) => {
      const template = getMask(digitIndex);
      const { display, map } = formatDigitsWithMap(template, '0'.repeat(digitIndex));

      for (let i = 0; i < map.length; i++) {
        if (map[i] === digitIndex) return i;
      }
      if (digitIndex >= map.length) return display.length;

      for (let i = 0; i < map.length; i++) {
        if (map[i]! > digitIndex) return i;
      }
      return display.length;
    },

    getDigitRange: (digits: string, selStart: number, selEnd: number) => {
      const template = getMask(digits.length);
      const { map } = formatDigitsWithMap(template, digits);

      let min = Infinity;
      let max = -Infinity;

      for (let i = selStart; i < selEnd && i < map.length; i++) {
        const digitIdx = map[i];
        if (digitIdx !== undefined && digitIdx >= 0) {
          min = Math.min(min, digitIdx);
          max = Math.max(max, digitIdx);
        }
      }

      return min === Infinity ? null : [min, max + 1];
    },

    isComplete: (digits: string) => {
      return variantsDigits.includes(digits.length);
    }
  };
}
