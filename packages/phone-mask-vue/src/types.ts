import type { MaskFull, CountryKey } from '@desource/phone-mask';

export type Size = 'compact' | 'normal' | 'large';
export type Theme = 'auto' | 'light' | 'dark';

export type PhoneNumber = {
  full: string;
  fullFormatted: string;
  digits: string;
};

export interface PhoneInputProps {
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
}

export interface PhoneInputEmits {
  /**
   * Emitted when the value changes.
   * Provides an object with:
   * - full: Full phone number with country code (e.g. +1234567890)
   * - fullFormatted: Full phone number formatted according to country rules (e.g. +1 234-567-890)
   * - digits: Only the digits of the phone number without country code (e.g. 234567890)
   */
  (e: 'change', value: PhoneNumber): void;
  /** Emitted when the country changes */
  (e: 'country-change', country: MaskFull): void;
  /** Emitted when validation state changes */
  (e: 'validation-change', isValid: boolean): void;
  /** Emitted on focus */
  (e: 'focus', event: FocusEvent): void;
  /** Emitted on blur */
  (e: 'blur', event: FocusEvent): void;
  /** Emitted when phone number is copied */
  (e: 'copy', value: string): void;
  /** Emitted when input is cleared */
  (e: 'clear'): void;
}

export interface PhoneInputSlots {
  /** Slot for custom action buttons before default ones */
  'actions-before': {};
  /** Slots for flag icons in the country list and country selector */
  flag: { country: MaskFull };
  /** Slot for custom copy buttons */
  'copy-svg': { copied: boolean };
  /** Slot for custom clear button */
  'clear-svg': {};
}

export interface PhoneInputExposed {
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

/** Configuration options for the phone mask directive */
export interface PMaskDirectiveOptions {
  /** Country ISO code (e.g., 'US', 'DE', 'GB') */
  country?: string;
  /** Locale for country names (default: navigator.language) */
  locale?: string;
  /** Auto-detect country from IP/locale (default: false) */
  detect?: boolean;
  /**
   * Callback when formatted value changes.
   * Provides full number, formatted phone number, and raw digits.
   * @example
   * onChange: (phone) => {
   *   console.log(phone.full); // +1234567890
   *   console.log(phone.fullFormatted); // +1 234-567-890
   *   console.log(phone.digits); // 234567890
   * }
   */
  onChange?: (phone: PhoneNumber) => void;
  /** Callback when country changes */
  onCountryChange?: (country: MaskFull) => void;
}

/** Internal state stored on the input element of the directive */
export interface PMaskDirectiveState {
  country: MaskFull;
  formatter: FormatterHelpers;
  digits: string; // Raw digits without formatting
  locale: string;
  options: PMaskDirectiveOptions;
  beforeInputHandler?: (e: InputEvent) => void;
  inputHandler?: (e: Event) => void;
  keydownHandler?: (e: KeyboardEvent) => void;
  pasteHandler?: (e: ClipboardEvent) => void;
}

/** Extended HTMLInputElement with directive state */
export interface DirectiveHTMLInputElement extends HTMLInputElement {
  __phoneMaskState?: PMaskDirectiveState;
}
