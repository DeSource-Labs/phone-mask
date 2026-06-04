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

export interface PhoneMaskDirectiveState {
  country: MaskFull;
  formatter: FormatterHelpers;
  digits: string;
  locale: string;
  options: PhoneMaskDirectiveOptions;
  setCountry?: (code: string) => boolean;
}

export interface DirectiveHTMLInputElement extends HTMLInputElement {
  __phoneMaskState?: PhoneMaskDirectiveState;
}

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
