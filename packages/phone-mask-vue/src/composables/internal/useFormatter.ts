import { computed, watchEffect, toValue } from 'vue';
import type { MaybeRefOrGetter, ComputedRef } from 'vue';
import { extractDigits, createPhoneFormatter, type MaskFull, type FormatterHelpers } from '@desource/phone-mask';

import type { PhoneNumber } from '../../types';

/** Configuration options for the useFormatter composable */
export interface UseFormatterOptions {
  /** Pre-resolved country data */
  country: MaybeRefOrGetter<MaskFull>;
  /**
   * Controlled value (digits only, without country code).
   * The parent is responsible for managing state via onChange callback.
   */
  value: MaybeRefOrGetter<string>;
  /** Callback when the digits value changes. */
  onChange: (digits: string) => void;
  /** Callback when the phone number changes. */
  onPhoneChange?: (value: PhoneNumber) => void;
  /** Callback when validation state (isComplete) changes */
  onValidationChange?: (isComplete: boolean) => void;
}

/** Return type for useFormatter composable */
export interface UseFormatterReturn {
  /** Raw digits without formatting */
  digits: ComputedRef<string>;
  /** Phone formatter instance */
  formatter: ComputedRef<FormatterHelpers>;
  /** Placeholder from formatter */
  displayPlaceholder: ComputedRef<string>;
  /** Formatted display string */
  displayValue: ComputedRef<string>;
  /** Full phone number with country code */
  full: ComputedRef<string>;
  /** Full phone number formatted */
  fullFormatted: ComputedRef<string>;
  /** Whether the phone number is complete */
  isComplete: ComputedRef<boolean>;
  /** Whether the input is empty */
  isEmpty: ComputedRef<boolean>;
  /** Whether to show validation warning */
  shouldShowWarn: ComputedRef<boolean>;
}

/**
 * Composable for phone number formatting and derived computations.
 * Receives pre-resolved country data; country management is handled by the caller.
 */
export function useFormatter({
  country,
  value,
  onChange,
  onPhoneChange,
  onValidationChange
}: UseFormatterOptions): UseFormatterReturn {
  const formatter = computed(() => createPhoneFormatter(toValue(country)));
  const maxDigits = computed(() => formatter.value.getMaxDigits());
  const digits = computed(() => extractDigits(toValue(value), maxDigits.value));

  const displayPlaceholder = computed(() => formatter.value.getPlaceholder());
  const displayValue = computed(() => formatter.value.formatDisplay(digits.value));

  const full = computed(() => (digits.value ? `${toValue(country).code}${digits.value}` : ''));
  const fullFormatted = computed(() => (displayValue.value ? `${toValue(country).code} ${displayValue.value}` : ''));

  const isComplete = computed(() => formatter.value.isComplete(digits.value));
  const isEmpty = computed(() => digits.value.length === 0);
  const shouldShowWarn = computed(() => !isEmpty.value && !isComplete.value);

  const phoneData = computed<PhoneNumber>(() => ({
    full: full.value,
    fullFormatted: fullFormatted.value,
    digits: digits.value
  }));

  // Clamp digits on formatter changes
  watchEffect(() => {
    if (toValue(value) !== digits.value) {
      onChange(digits.value);
    }
  });

  // Emit onPhoneChange
  watchEffect(() => {
    onPhoneChange?.(phoneData.value);
  });

  // Emit onValidationChange
  watchEffect(() => {
    onValidationChange?.(isComplete.value);
  });

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
