import type { CountryKey, MaskFull } from '@desource/phone-mask';
import {
  createPhoneFormatter,
  extractDigits,
  getCountry,
  getNavigatorLang,
  parseCountryCode,
  type FormatterHelpers
} from '@desource/phone-mask/kit';
import type { PhoneMaskConfig, PhoneMaskFormatMode, PhoneMaskFormatOptions, PhoneNumber } from '../types';

export const DEFAULT_COUNTRY = 'US';

export function resolveLocale(locale: string | undefined, config: PhoneMaskConfig): string {
  return locale || config.locale || getNavigatorLang();
}

export function resolveCountryCode(country: CountryKey | string | null | undefined, config: PhoneMaskConfig): string {
  return parseCountryCode(country, parseCountryCode(config.country, DEFAULT_COUNTRY));
}

export function resolveCountry(
  country: CountryKey | string | null | undefined,
  locale: string | undefined,
  config: PhoneMaskConfig
): MaskFull {
  return getCountry(resolveCountryCode(country, config), resolveLocale(locale, config));
}

export function createPhoneNumber(digits: string, country: MaskFull, formatter: FormatterHelpers): PhoneNumber {
  const displayValue = formatter.formatDisplay(digits);

  return {
    full: digits ? `${country.code}${digits}` : '',
    fullFormatted: displayValue ? `${country.code} ${displayValue}` : '',
    digits
  };
}

export function createPhoneState(value: string | number | null | undefined, country: MaskFull) {
  const formatter = createPhoneFormatter(country);
  const digits = extractDigits(String(value ?? ''), formatter.getMaxDigits());
  const phone = createPhoneNumber(digits, country, formatter);
  const isComplete = formatter.isComplete(digits);
  const isEmpty = digits.length === 0;

  return {
    ...phone,
    country,
    formatter,
    isComplete,
    isEmpty,
    shouldShowWarn: !isEmpty && !isComplete
  };
}

export function formatPhoneValue(
  value: string | number | null | undefined,
  options: PhoneMaskFormatOptions,
  config: PhoneMaskConfig
): string {
  const mode: PhoneMaskFormatMode = options.mode ?? 'display';
  const country = resolveCountry(options.country, options.locale, config);
  const state = createPhoneState(value, country);

  if (mode === 'placeholder') return state.formatter.getPlaceholder();
  if (mode === 'full') return state.full;
  if (mode === 'fullFormatted') return state.fullFormatted;

  return state.formatter.formatDisplay(state.digits);
}
