import type { CountryKey, MaskFull } from '@desource/phone-mask';
import type { FormatterHelpers } from '@desource/phone-mask/kit';

export type Size = 'compact' | 'normal' | 'large';
export type Theme = 'auto' | 'light' | 'dark';
export type PhoneMaskFormatMode = 'display' | 'full' | 'fullFormatted' | 'placeholder';

export interface PhoneNumber {
  full: string;
  fullFormatted: string;
  digits: string;
}

export interface PhoneMaskConfig {
  /** Default ISO 3166-1 alpha-2 country code. */
  country?: CountryKey | string;
  /** Default locale for country names. */
  locale?: string;
  /** Default country auto-detection behavior for APIs that support detection. */
  detect?: boolean;
}

export interface PhoneMaskFormatOptions {
  /** ISO 3166-1 alpha-2 country code. */
  country?: CountryKey | string;
  /** Locale for country names. */
  locale?: string;
  /** Returned formatting mode. */
  mode?: PhoneMaskFormatMode;
}

export interface PhoneMaskDirectiveOptions {
  /** Country ISO code (e.g. US, DE, GB). */
  country?: CountryKey | string;
  /** Locale for country names. */
  locale?: string;
  /** Auto-detect country from GeoIP/locale. */
  detect?: boolean;
  /** Called when formatted phone data changes. */
  onChange?: (phone: PhoneNumber) => void;
  /** Called when selected country changes. */
  onCountryChange?: (country: MaskFull) => void;
}

export type PhoneMaskDirectiveInput = CountryKey | string | PhoneMaskDirectiveOptions | null | undefined;

export interface PhoneInputRef {
  /** Focus the phone input. */
  focus: () => void;
  /** Blur the phone input. */
  blur: () => void;
  /** Clear the phone input. */
  clear: () => void;
  /** Select a country by its ISO 3166-1 alpha-2 code. */
  selectCountry: (country: CountryKey | string) => boolean;
  /** Get the full phone number with country code (e.g. +1234567890). */
  getFullNumber: () => string;
  /** Get the full phone number formatted according to country rules (e.g. +1 234-567-890). */
  getFullFormattedNumber: () => string;
  /** Get only the digits of the phone number without country code (e.g. 234567890). */
  getDigits: () => string;
  /** Check if the current phone number is valid. */
  isValid: () => boolean;
  /** Check if the current phone number is complete. */
  isComplete: () => boolean;
}

export interface PhoneMaskState {
  country: MaskFull;
  formatter: FormatterHelpers;
  digits: string;
  full: string;
  fullFormatted: string;
  isComplete: boolean;
  isEmpty: boolean;
  shouldShowWarn: boolean;
}
