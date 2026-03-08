import type { MaskFull, CountryKey, FormatterHelpers } from '@desource/phone-mask';
import type { Snippet } from 'svelte';

export type Size = 'compact' | 'normal' | 'large';
export type Theme = 'auto' | 'light' | 'dark';

export type PhoneNumber = {
  full: string;
  fullFormatted: string;
  digits: string;
};

export interface PhoneInputProps {
  value?: string;
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
  onchange?: (data: PhoneNumber) => void;
  oncountrychange?: (country: MaskFull) => void;
  onvalidationchange?: (complete: boolean) => void;
  onfocus?: (e: FocusEvent) => void;
  onblur?: (e: FocusEvent) => void;
  oncopy?: (value: string) => void;
  onclear?: () => void;
  flag?: Snippet<[MaskFull]>;
  copysvg?: Snippet<[boolean]>;
  clearsvg?: Snippet<[]>;
  actionsbefore?: Snippet<[]>;
  /** Extra CSS class(es) merged onto the root element */
  class?: string;
  /** Any additional HTML attributes are forwarded to the root element */
  [key: string]: unknown;
}

export interface PhoneInputExposed {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  selectCountry: (code?: string | null) => void;
  getFullNumber: () => string;
  getFullFormattedNumber: () => string;
  getDigits: () => string;
  isValid: () => boolean;
  isComplete: () => boolean;
}

export interface UsePhoneMaskOptions {
  /** Controlled value getter — digits only, without country code */
  value: () => string;
  /** Called when digits change */
  onChange: (digits: string) => void;
  /** Country ISO 3166-1 alpha-2 code getter */
  country?: () => string | undefined;
  /** Locale for country names getter (defaults to browser language) */
  locale?: () => string | undefined;
  /** Auto-detect country via GeoIP getter */
  detect?: () => boolean | undefined;
  /** Called on every phone number update */
  onPhoneChange?: (data: PhoneNumber) => void;
  /** Called when country changes */
  onCountryChange?: (country: MaskFull) => void;
}

export interface UsePhoneMaskReturn {
  /** Bind this to your &lt;input&gt; element via bind:this */
  inputRef: HTMLInputElement | null;
  digits: string;
  /** Phone formatter instance */
  formatter: FormatterHelpers;
  full: string;
  fullFormatted: string;
  isComplete: boolean;
  isEmpty: boolean;
  shouldShowWarn: boolean;
  country: MaskFull;
  locale: string;
  setCountry: (countryCode?: string | null) => boolean;
  clear: () => void;
}

export interface PhoneMaskAttachmentOptions {
  country?: string;
  locale?: string;
  detect?: boolean;
  onChange?: (phone: PhoneNumber) => void;
  onCountryChange?: (country: MaskFull) => void;
}

export interface PhoneMaskAttachmentState {
  country: MaskFull;
  formatter: FormatterHelpers;
  digits: string;
  locale: string;
  options: PhoneMaskAttachmentOptions;
  setCountry: (code: string) => boolean;
}

export interface PhoneMaskAttachmentElement extends HTMLInputElement {
  __phoneMaskState?: PhoneMaskAttachmentState;
}

export interface PhoneMaskActionOptions {
  country?: string;
  locale?: string;
  detect?: boolean;
  onChange?: (phone: PhoneNumber) => void;
  onCountryChange?: (country: MaskFull) => void;
}

export interface PhoneMaskActionState {
  country: MaskFull;
  formatter: FormatterHelpers;
  digits: string;
  locale: string;
  options: PhoneMaskActionOptions;
  setCountry: (code: string) => boolean;
}

export interface PhoneMaskActionElement extends HTMLInputElement {
  __phoneMaskActionState?: PhoneMaskActionState;
}
