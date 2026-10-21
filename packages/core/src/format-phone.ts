import { MasksWithFlagMap, type CountryKey } from './entries.js';
import { detectCountryFromPhone } from './country-detection.js';
import { countPlaceholders, formatDigitsWithMap, pickMaskVariant } from './utils.js';
import { extractDigits } from './handlers.js';

export interface PhoneFormatOptions {
  /** Include the country calling code. Defaults to true. */
  readonly code?: boolean;
  /** Prefix the formatted number with the country's flag emoji. Defaults to false. */
  readonly flag?: boolean;
}

/** Format phone numbers with or without an explicit calling code for display. */
export function formatPhone(
  value: string | null | undefined,
  country?: CountryKey | null,
  options: PhoneFormatOptions = {}
): string {
  if (!value?.trim()) return '';
  let resolved = country == null ? undefined : MasksWithFlagMap[country.toUpperCase() as CountryKey];
  if ((country != null && !resolved) || !/^\+?[\d\s().-]+$/.test(value.trim())) return value;

  let digits = extractDigits(value);
  if (value.trimStart().startsWith('+')) {
    if (!resolved || !digits.startsWith(resolved.code.slice(1))) {
      const detected = detectCountryFromPhone(value);
      resolved = detected && MasksWithFlagMap[detected];
    }
    if (!resolved) return value;
    digits = digits.slice(resolved.code.length - 1);
  }
  if (!resolved) return value;

  const mask = pickMaskVariant(resolved.mask, digits.length);
  if (!digits || digits.length > countPlaceholders(mask)) return value;

  let display = formatDigitsWithMap(mask, digits).display.replace(/\D+/g, ' ').trim();
  if (options.code !== false) display = `${resolved.code} ${display}`;
  if (options.flag) display = `${resolved.flag} ${display}`;
  return display;
}
