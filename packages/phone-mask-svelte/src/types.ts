import type { MaskFull, CountryKey, FormatterHelpers } from '@desource/phone-mask';

export type Size = 'compact' | 'normal' | 'large';
export type Theme = 'auto' | 'light' | 'dark';

export type PhoneNumber = {
  full: string;
  fullFormatted: string;
  digits: string;
};

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
