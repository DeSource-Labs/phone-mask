import { useEffect, useMemo } from 'react';
import { extractDigits, createPhoneFormatter, type MaskFull, type FormatterHelpers } from '@desource/phone-mask';

import type { PhoneNumber } from '../../types';

/** Configuration options for the useFormatter hook */
export interface UseFormatterOptions {
  /** Pre-resolved country data */
  country: MaskFull;
  /**
   * Controlled value (digits only, without country code)
   * The parent is responsible for managing state via onChange callback.
   */
  value: string;
  /** Callback when the digits value changes. */
  onChange: (digits: string) => void;
  /** Callback when the phone number changes. */
  onPhoneChange?: (value: PhoneNumber) => void;
  /** Callback when validation state (isComplete) changes */
  onValidationChange?: (isComplete: boolean) => void;
}

/** Return type for useFormatter hook */
export interface UseFormatterReturn {
  /** Raw digits without formatting */
  digits: string;
  /** Phone formatter instance */
  formatter: FormatterHelpers;
  /** Placeholder from formatter */
  displayPlaceholder: string;
  /** Formatted display string */
  displayValue: string;
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
}

/**
 * Hook for phone number formatting and derived computations.
 * Receives pre-resolved country data; country management is handled by the caller.
 */
export function useFormatter({
  country,
  value,
  onChange,
  onPhoneChange,
  onValidationChange
}: UseFormatterOptions): UseFormatterReturn {
  const formatter = useMemo(() => createPhoneFormatter(country), [country]);
  const maxDigits = formatter.getMaxDigits();
  const digits = useMemo(() => extractDigits(value, maxDigits), [value, maxDigits]);

  const displayPlaceholder = formatter.getPlaceholder();
  const displayValue = formatter.formatDisplay(digits);

  const full = digits ? `${country.code}${digits}` : '';
  const fullFormatted = displayValue ? `${country.code} ${displayValue}` : '';

  const isComplete = formatter.isComplete(digits);
  const isEmpty = digits.length === 0;
  const shouldShowWarn = !isEmpty && !isComplete;

  // Memoize phoneData to prevent infinite loops in useEffect
  const phoneData = useMemo<PhoneNumber>(() => ({ full, fullFormatted, digits }), [full, fullFormatted, digits]);

  // Clamp digits on formatter changes
  useEffect(() => {
    if (value !== digits) {
      onChange(digits);
    }
  }, [value, digits, onChange]);

  // Effect: Emit onPhoneChange
  useEffect(() => {
    onPhoneChange?.(phoneData);
  }, [phoneData, onPhoneChange]);

  // Effect: Emit onValidationChange
  useEffect(() => {
    onValidationChange?.(isComplete);
  }, [isComplete, onValidationChange]);

  return {
    digits,
    formatter,
    displayPlaceholder,
    displayValue,
    full,
    fullFormatted,
    isComplete,
    isEmpty,
    shouldShowWarn
  };
}
