import type { MaskFull, CountryKey, FormatterHelpers } from '@desource/phone-mask';
import type { Snippet } from 'svelte';

/** Size preset for the component */
export type Size = 'compact' | 'normal' | 'large';
/** Theme preset for the component */
export type Theme = 'auto' | 'light' | 'dark';

/** Normalized phone payload emitted by component/composable callbacks */
export type PhoneNumber = {
  /** Full phone number with country code (e.g. +1234567890) */
  full: string;
  /** Full formatted phone number (e.g. +1 234-567-890) */
  fullFormatted: string;
  /** Digits only, without country code (e.g. 234567890) */
  digits: string;
};

export interface PhoneInputProps {
  /** Controlled/bindable value (digits only, without country code) */
  value?: string;
  /** Optional id attribute applied to the underlying phone input element */
  id?: string;
  /** Optional name attribute applied to the underlying phone input element */
  name?: string;
  /** Whether to preselect a country by ISO 3166-1 alpha-2 code */
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

  /**
   * Callback when the phone number changes.
   * Provides:
   * - full: Full phone number with country code
   * - fullFormatted: Full formatted phone number
   * - digits: Digits without country code
   */
  onchange?: (data: PhoneNumber) => void;
  /** Callback when the country changes */
  oncountrychange?: (country: MaskFull) => void;
  /** Callback when validation state changes */
  onvalidationchange?: (complete: boolean) => void;
  /** Callback on focus */
  onfocus?: (e: FocusEvent) => void;
  /** Callback on blur */
  onblur?: (e: FocusEvent) => void;
  /** Callback when phone number is copied */
  oncopy?: (value: string) => void;
  /** Callback when input is cleared */
  onclear?: () => void;

  /** Snippet for custom flag rendering in selector + dropdown */
  flag?: Snippet<[MaskFull]>;
  /** Snippet for custom copy icon */
  copysvg?: Snippet<[boolean]>;
  /** Snippet for custom clear icon */
  clearsvg?: Snippet<[]>;
  /** Snippet rendered before built-in action buttons */
  actionsbefore?: Snippet<[]>;
  /** Extra CSS class(es) merged onto the root element */
  class?: string;
  /** Any additional HTML attributes are forwarded to the root element */
  [key: string]: unknown;
}

export interface PhoneInputExposed {
  /** Focus the phone input */
  focus: () => void;
  /** Blur the phone input */
  blur: () => void;
  /** Clear the phone input */
  clear: () => void;
  /** Select a country by ISO code */
  selectCountry: (code?: string | null) => void;
  /** Get full phone number with country code */
  getFullNumber: () => string;
  /** Get full formatted phone number with country code */
  getFullFormattedNumber: () => string;
  /** Get digits only (without country code) */
  getDigits: () => string;
  /** Check whether current phone number is valid */
  isValid: () => boolean;
  /** Alias for isValid() */
  isComplete: () => boolean;
}

/** Configuration options for the phone mask composable */
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

/** Return type for usePhoneMask composable */
export interface UsePhoneMaskReturn {
  /** Bind this to your &lt;input&gt; element via bind:this */
  inputRef: HTMLInputElement | null;
  /** Raw digits without formatting */
  digits: string;
  /** Phone formatter instance */
  formatter: FormatterHelpers;
  /** Full phone number with country code */
  full: string;
  /** Full formatted phone number with country code */
  fullFormatted: string;
  /** Whether the current phone number is complete */
  isComplete: boolean;
  /** Whether input has no digits */
  isEmpty: boolean;
  /** Whether validation warning should be shown */
  shouldShowWarn: boolean;
  /** Current selected country data */
  country: MaskFull;
  /** Current locale used for country names */
  locale: string;
  /** Change selected country by ISO code */
  setCountry: (countryCode?: string | null) => boolean;
  /** Clear the input value */
  clear: () => void;
}

/** Configuration options for Svelte action/attachment binding */
export interface PhoneMaskBindingOptions {
  /** Country ISO code (e.g., 'US', 'DE', 'GB') */
  country?: string;
  /** Locale for country names (default: navigator.language) */
  locale?: string;
  /** Auto-detect country from IP/locale (default: false) */
  detect?: boolean;
  /** Callback when phone value changes */
  onChange?: (phone: PhoneNumber) => void;
  /** Callback when selected country changes */
  onCountryChange?: (country: MaskFull) => void;
}

/** Internal state stored on bound input element */
export interface PhoneMaskBindingState {
  /** Current selected country */
  country: MaskFull;
  /** Formatter instance for current country */
  formatter: FormatterHelpers;
  /** Raw digits without formatting */
  digits: string;
  /** Current locale used for country names */
  locale: string;
  /** Current binding options */
  options: PhoneMaskBindingOptions;
  /** Programmatically change country by ISO code */
  setCountry: (code: string) => boolean;
}

/** Extended HTMLInputElement carrying phone-mask internal state */
export interface PhoneMaskBindingElement extends HTMLInputElement {
  __phoneMaskState?: PhoneMaskBindingState;
}
