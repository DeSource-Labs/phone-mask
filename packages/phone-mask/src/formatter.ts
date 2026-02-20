// Phone number formatter utilities
import { toArray, countPlaceholders, removeCountryCodePrefix, pickMaskVariant, formatDigitsWithMap } from './utils';
import type { MaskFull } from './entries';

/**
 * Formatter interface for digit range and caret calculations
 */
export interface FormatterHelpers {
  /**
   * Format digits into display string with mask delimiters
   */
  formatDisplay: (digits: string) => string;

  /**
   * Get maximum number of digits for the current country
   */
  getMaxDigits: () => number;

  /**
   * Get placeholder string for the input
   */
  getPlaceholder: () => string;

  /**
   * Get caret position in display string for given digit index
   */
  getCaretPosition: (digitIndex: number) => number;

  /**
   * Get digit range [start, end) for selection range in display string
   * Returns null if no digits are selected
   */
  getDigitRange: (digits: string, selStart: number, selEnd: number) => [number, number] | null;

  /**
   * Check if the current number of digits is a valid complete phone number
   */
  isComplete: (digits: string) => boolean;
}

/**
 * Create a phone formatter for a given country
 */
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
