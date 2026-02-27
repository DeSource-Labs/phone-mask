import { extractDigits, createPhoneFormatter, type MaskFull, type FormatterHelpers } from '@desource/phone-mask';
import type { PhoneNumber } from '../../types';

export interface UseFormatterOptions {
  /** Pre-resolved country data getter */
  country: () => MaskFull;
  /**
   * Controlled value getter (digits only, without country code).
   * The parent is responsible for managing state via onChange callback.
   */
  value: () => string;
  /** Callback when the digits value changes. */
  onChange: (digits: string) => void;
  /** Callback when the phone number changes. */
  onPhoneChange?: (value: PhoneNumber) => void;
  /** Callback when validation state (isComplete) changes */
  onValidationChange?: (isComplete: boolean) => void;
}

export function useFormatter({ country, value, onChange, onPhoneChange, onValidationChange }: UseFormatterOptions) {
  const formatter = $derived<FormatterHelpers>(createPhoneFormatter(country()));
  const maxDigits = $derived<number>(formatter.getMaxDigits());
  const digits = $derived<string>(extractDigits(value(), maxDigits));

  const displayPlaceholder = $derived<string>(formatter.getPlaceholder());
  const displayValue = $derived<string>(formatter.formatDisplay(digits));

  const full = $derived<string>(digits ? `${country().code}${digits}` : '');
  const fullFormatted = $derived<string>(displayValue ? `${country().code} ${displayValue}` : '');

  const isComplete = $derived<boolean>(formatter.isComplete(digits));
  const isEmpty = $derived<boolean>(digits.length === 0);
  const shouldShowWarn = $derived<boolean>(!isEmpty && !isComplete);

  const phoneData = $derived<PhoneNumber>({ full, fullFormatted, digits });

  // Clamp digits on formatter changes
  $effect(() => {
    if (value() !== digits) {
      onChange(digits);
    }
  });

  // Emit onPhoneChange
  $effect(() => {
    onPhoneChange?.(phoneData);
  });

  // Emit onValidationChange
  $effect(() => {
    onValidationChange?.(isComplete);
  });

  return {
    get digits() {
      return digits;
    },
    get formatter() {
      return formatter;
    },
    get displayPlaceholder() {
      return displayPlaceholder;
    },
    get displayValue() {
      return displayValue;
    },
    get full() {
      return full;
    },
    get fullFormatted() {
      return fullFormatted;
    },
    get isComplete() {
      return isComplete;
    },
    get isEmpty() {
      return isEmpty;
    },
    get shouldShowWarn() {
      return shouldShowWarn;
    }
  };
}
