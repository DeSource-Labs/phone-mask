// Mask/digits formatting and input handling
import { ref, computed, nextTick, toValue, watchEffect } from 'vue';
import type { ComputedRef, MaybeRefOrGetter } from 'vue';
import {
  extractDigits,
  setCaret,
  processBeforeInput,
  processInput,
  processKeydown,
  processPaste,
  createPhoneFormatter,
  type MaskFull
} from '@desource/phone-mask';
import { useTimer } from './useTimer';

import type { PhoneNumber } from '../types';

const HINT_DELAY_INPUT = 500;
const HINT_DELAY_ACTION = 300;

interface UseMaskOptions {
  value: MaybeRefOrGetter<string>;
  country: ComputedRef<MaskFull>;
  onChange: (newDigits: string) => void;
  onPhoneDataChange?: (data: PhoneNumber) => void;
}

export function useMask({
  value,
  country,
  onChange,
  onPhoneDataChange,
}: UseMaskOptions) {
  const showValidationHint = ref(false);

  /** Formatter for the country country */
  const formatter = computed(() => createPhoneFormatter(country.value));
  const maxDigits = computed(() => formatter.value.getMaxDigits());
  const digits = computed(() => extractDigits(toValue(value), maxDigits.value));

  watchEffect(() => {
    if (toValue(value) !== digits.value) {
      onChange(digits.value);
    }
  });

  const displayPlaceholder = computed(() => formatter.value.getPlaceholder());
  const displayValue = computed(() => formatter.value.formatDisplay(digits.value));

  const isComplete = computed(() => formatter.value.isComplete(digits.value));
  const isEmpty = computed(() => digits.value.length === 0);
  const shouldShowWarn = computed(() => showValidationHint.value && !isEmpty.value && !isComplete.value);

  const fullFormatted = computed(() => {
    if (!displayValue.value) return '';
    return `${country.value.code} ${displayValue.value}`;
  });

  const full = computed(() => {
    if (!digits.value) return '';
    return `${country.value.code}${digits.value}`;
  });

  const phoneData = computed<PhoneNumber>(() => ({
    full: full.value,
    fullFormatted: fullFormatted.value,
    digits: digits.value
  }));

  watchEffect(() => {
    onPhoneDataChange?.(phoneData.value);
  });

  /** Set caret to specific digit position */
  const scheduleCaretUpdate = (el: HTMLInputElement | null, digitIndex: number) => {
    nextTick(() => {
      const pos = formatter.value.getCaretPosition(digitIndex);
      setCaret(el, pos);
    });
  };

  const validationTimer = useTimer();

  /** Reset hint, cancel previous timer and schedule a new one */
  const scheduleValidationHint = (delay: number) => {
    showValidationHint.value = false;
    validationTimer.set(() => {
      if (!isComplete.value && !isEmpty.value) showValidationHint.value = true;
    }, delay);
  };

  const handleBeforeInput = processBeforeInput;

  const handleInput = (e: Event) => {
    const result = processInput(e, { formatter: formatter.value });
    if (!result) return;

    onChange(result.newDigits);
    scheduleValidationHint(HINT_DELAY_INPUT);
    scheduleCaretUpdate(e.target as HTMLInputElement | null, result.caretDigitIndex);
  };

  const handleKeydown = (e: KeyboardEvent) => {
    const result = processKeydown(e, {
      digits: digits.value,
      formatter: formatter.value
    });

    if (!result) return;

    onChange(result.newDigits);
    scheduleValidationHint(HINT_DELAY_ACTION);
    scheduleCaretUpdate(e.target as HTMLInputElement | null, result.caretDigitIndex);
  };

  const handlePaste = (e: ClipboardEvent) => {
    const result = processPaste(e, {
      digits: digits.value,
      formatter: formatter.value
    });

    if (!result) return;

    onChange(result.newDigits);
    scheduleValidationHint(HINT_DELAY_ACTION);
    scheduleCaretUpdate(e.target as HTMLInputElement | null, result.caretDigitIndex);
  };

  const handleFocus = () => {
    // Do not hide the hint on focus; keep it visible if already shown
    validationTimer.clear();
  };

  /** Clear/reset function */
  const clear = () => {
    onChange('');
    showValidationHint.value = false;
    validationTimer.clear();
  };

  return {
    // Computed
    digits,
    displayPlaceholder,
    displayValue,
    isComplete,
    isEmpty,
    shouldShowWarn,
    fullFormatted,
    full,

    // Handlers
    handleBeforeInput,
    handleInput,
    handleKeydown,
    handlePaste,
    handleFocus,

    // Methods
    clear
  };
}
