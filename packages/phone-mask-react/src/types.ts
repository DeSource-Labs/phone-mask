import type { MaskFull, CountryKey } from '@desource/phone-mask';
import type { ReactNode, FocusEvent, RefObject } from 'react';

export type Size = 'compact' | 'normal' | 'large';
export type Theme = 'auto' | 'light' | 'dark';

export interface PhoneNumber {
  full: string;
  fullFormatted: string;
  digits: string;
}

export interface PhoneInputProps {
  /** Controlled value (digits only, without country code) */
  value?: string;
  /** Whether to preselect a country by its ISO 3166-1 alpha-2 code */
  country?: CountryKey;
  /**
   * Whether to auto-detect country via geo IP lookup.
   * Note: This requires an external geo IP service and may not work in all environments.
   * @default true
   */
  detect?: boolean;
  /** Locale for country names (defaults to browser language) */
  locale?: string;
  /**
   * Size preset for the component ("compact" | "normal" | "large").
   * @default 'normal'
   */
  size?: Size;
  /**
   * Theme preset for the component ("auto" | "light" | "dark").
   * @default 'auto'
   */
  theme?: Theme;
  /**
   * Whether the input is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the input is readonly.
   * @default false
   */
  readonly?: boolean;
  /**
   * Whether to show the copy button.
   * @default true
   */
  showCopy?: boolean;
  /**
   * Whether to show the clear button.
   * @default false
   */
  showClear?: boolean;
  /**
   * Whether to show validation related styles (border & outline).
   * @default true
   */
  withValidity?: boolean;
  /**
   * Custom search placeholder.
   * @default 'Search country or code...'
   */
  searchPlaceholder?: string;
  /**
   * Custom no results text.
   * @default 'No countries found'
   */
  noResultsText?: string;
  /**
   * Custom clear button label.
   * @default 'Clear phone number'
   */
  clearButtonLabel?: string;
  /** Dropdown menu custom class */
  dropdownClass?: string;
  /**
   * Whether to disable default internal styles.
   * @default false
   */
  disableDefaultStyles?: boolean;

  // Callbacks
  /**
   * Callback when the digits value changes.
   * Returns only the digits without country code (e.g. '234567890')
   */
  onChange?: (digits: string) => void;
  /**
   * Callback when the phone number changes.
   * Provides an object with:
   * - full: Full phone number with country code (e.g. +1234567890)
   * - fullFormatted: Full phone number formatted according to country rules (e.g. +1 234-567-890)
   * - digits: Only the digits of the phone number without country code (e.g. 234567890)
   */
  onPhoneChange?: (value: PhoneNumber) => void;
  /** Callback when the country changes */
  onCountryChange?: (country: MaskFull) => void;
  /** Callback when validation state changes */
  onValidationChange?: (isValid: boolean) => void;
  /** Callback on focus */
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  /** Callback on blur */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  /** Callback when phone number is copied */
  onCopy?: (value: string) => void;
  /** Callback when input is cleared */
  onClear?: () => void;

  // Render props (equivalent to Vue slots)
  /** Render custom action buttons before default ones */
  renderActionsBefore?: () => ReactNode;
  /** Render custom flag icons in the country list and country selector */
  renderFlag?: (country: MaskFull) => ReactNode;
  /** Render custom copy button SVG */
  renderCopySvg?: (copied: boolean) => ReactNode;
  /** Render custom clear button SVG */
  renderClearSvg?: () => ReactNode;
}

export interface PhoneInputRef {
  /** Focus the phone input */
  focus: () => void;
  /** Blur the phone input */
  blur: () => void;
  /** Clear the phone input */
  clear: () => void;
  /** Select a country by its ISO 3166-1 alpha-2 code */
  selectCountry: (country: CountryKey) => void;
  /** Get the full phone number with country code (e.g. +1234567890) */
  getFullNumber: () => string;
  /** Get the full phone number formatted according to country rules (e.g. +1 234-567-890) */
  getFullFormattedNumber: () => string;
  /** Get only the digits of the phone number without country code (e.g. 234567890) */
  getDigits: () => string;
  /** Check if the current phone number is valid */
  isValid: () => boolean;
  /** Check if the current phone number is complete */
  isComplete: () => boolean;
}

export interface FormatterHelpers {
  formatDisplay: (digits: string) => string;
  getMaxDigits: () => number;
  getPlaceholder: () => string;
  getCaretPosition: (digitIndex: number) => number;
  getDigitRange: (digits: string, selStart: number, selEnd: number) => [number, number] | null;
  isComplete: (digits: string) => boolean;
}

export interface PMaskGeoCache {
  country_code: string;
  ts: number;
}

/** Configuration options for the phone mask hook */
export interface UsePhoneMaskOptions {
  /** Country ISO code (e.g., 'US', 'DE', 'GB') */
  country?: string;
  /** Locale for country names (default: navigator.language) */
  locale?: string;
  /** Auto-detect country from IP/locale (default: false) */
  detect?: boolean;
  /**
   * Callback when formatted value changes.
   * Provides full number, formatted phone number, and raw digits.
   */
  onChange?: (phone: PhoneNumber) => void;
  /** Callback when country changes */
  onCountryChange?: (country: MaskFull) => void;
}

/** Return type for usePhoneMask hook */
export interface UsePhoneMaskReturn {
  /** Ref to attach to input element */
  ref: RefObject<HTMLInputElement | null>;
  /** Raw digits without formatting */
  digits: string;
  /** Full phone number with country code */
  full: string;
  /** Full phone number formatted */
  fullFormatted: string;
  /** Whether the phone number is complete */
  isComplete: boolean;
  /** Whether the input is empty */
  isEmpty: boolean;
  /** Whether to show validation warning */
  shouldShowWarn: boolean;
  /** Current country data */
  country: MaskFull;
  /** Change country programmatically */
  setCountry: (countryCode: string) => void;
  /** Clear the input */
  clear: () => void;
}
