import type { Signal } from '@angular/core';
import type { CountryKey, MaskFull } from '@desource/phone-mask';
import type { FormatterHelpers } from '@desource/phone-mask/kit';

export type MaybeGetter<T> = T | (() => T);
export type Size = 'compact' | 'normal' | 'large';
export type Theme = 'auto' | 'light' | 'dark';

export interface PhoneNumber {
  full: string;
  fullFormatted: string;
  digits: string;
}

export interface PhonePipeOptions {
  /** Include the country calling code. Defaults to true. */
  readonly code?: boolean;
  /** Prefix the formatted number with the country's flag emoji. Defaults to false. */
  readonly flag?: boolean;
}

export interface UsePhoneMaskOptions {
  /** Native input getter, such as a viewChild query; optional for formatting without an input. */
  input?: () => HTMLInputElement | null | undefined;
  /** Controlled national digits, without the country calling code. */
  value: MaybeGetter<string>;
  onChange: (digits: string) => void;
  country?: MaybeGetter<string | undefined>;
  /** Defaults to English during SSR, then the browser language after hydration. */
  locale?: MaybeGetter<string | undefined>;
  /** Opt in to country detection after rendering in the browser. */
  detect?: MaybeGetter<boolean | undefined>;
  onPhoneChange?: (phone: PhoneNumber) => void;
  onCountryChange?: (country: MaskFull) => void;
}

export interface UsePhoneMaskReturn {
  digits: Signal<string>;
  formatter: Signal<FormatterHelpers>;
  displayValue: Signal<string>;
  displayPlaceholder: Signal<string>;
  full: Signal<string>;
  fullFormatted: Signal<string>;
  isComplete: Signal<boolean>;
  isEmpty: Signal<boolean>;
  shouldShowWarn: Signal<boolean>;
  country: Signal<MaskFull>;
  locale: Signal<string>;
  setCountry: (code?: string | null) => boolean;
  clear: () => void;
}

export interface PhoneInputProps {
  id?: string;
  name?: string;
  country?: CountryKey;
  detect?: boolean;
  locale?: string;
  size?: Size;
  theme?: Theme;
  disabled?: boolean;
  readonly?: boolean;
  showCopy?: boolean;
  showClear?: boolean;
  withValidity?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
  clearButtonLabel?: string;
  dropdownClass?: string;
  disableDefaultStyles?: boolean;
}

export interface PhoneInputExposed {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  selectCountry: (country: CountryKey) => void;
  getFullNumber: () => string;
  getFullFormattedNumber: () => string;
  getDigits: () => string;
  isValid: () => boolean;
  isComplete: () => boolean;
}

export interface PhoneMaskDirectiveOptions {
  country?: string;
  locale?: string;
  detect?: boolean;
  onChange?: (phone: PhoneNumber) => void;
  onCountryChange?: (country: MaskFull) => void;
}
