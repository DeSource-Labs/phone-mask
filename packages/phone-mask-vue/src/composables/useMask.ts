// Mask/digits formatting and input handling
import { ref, computed, watch, nextTick } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import {
  setCaret,
  processBeforeInput,
  processInput,
  processKeydown,
  processPaste,
  createPhoneFormatter,
  type MaskFull
} from '@desource/phone-mask';
import { useTimer } from './useTimer';

const HINT_DELAY_INPUT = 500;
const HINT_DELAY_ACTION = 300;

export function useMask(selected: ComputedRef<MaskFull>, telRef: Ref<HTMLInputElement | null>) {
  const digits = ref('');
  const displayValue = ref('');
  const showValidationHint = ref(false);

  /** Formatter for the selected country */
  const formatter = computed(() => createPhoneFormatter(selected.value));

  const displayPlaceholder = computed(() => formatter.value.getPlaceholder());
  const isComplete = computed(() => formatter.value.isComplete(digits.value));
  const isEmpty = computed(() => digits.value.length === 0);
  const maxDigits = computed(() => formatter.value.getMaxDigits());
  const shouldShowWarn = computed(() => showValidationHint.value && !isEmpty.value && !isComplete.value);
  const fullFormatted = computed(() => {
    if (!displayValue.value) return '';
    return `${selected.value.code} ${displayValue.value}`;
  });
  const full = computed(() => {
    if (!digits.value) return '';
    return `${selected.value.code}${digits.value}`;
  });

  /** Update display from current digits value */
  const updateDisplay = () => {
    displayValue.value = formatter.value.formatDisplay(digits.value);
  };

  /** Set caret to specific digit position */
  const setCaretToDigitPosition = (digitIndex: number) => {
    const pos = formatter.value.getCaretPosition(digitIndex);
    setCaret(telRef.value, pos);
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

    digits.value = result.newDigits;
    updateDisplay();
    scheduleValidationHint(HINT_DELAY_INPUT);

    nextTick(() => {
      setCaretToDigitPosition(result.caretDigitIndex);
    });
  };

  const handleKeydownInternal = (e: KeyboardEvent) => {
    const result = processKeydown(e, {
      digits: digits.value,
      formatter: formatter.value
    });

    if (!result) return;

    digits.value = result.newDigits;
    updateDisplay();
    nextTick(() => setCaretToDigitPosition(result.caretDigitIndex));
  };

  const handleKeydown = (e: KeyboardEvent) => {
    handleKeydownInternal(e);
    scheduleValidationHint(HINT_DELAY_ACTION);
  };

  const handlePaste = (e: ClipboardEvent) => {
    const result = processPaste(e, {
      digits: digits.value,
      formatter: formatter.value
    });

    if (!result) return;

    digits.value = result.newDigits;
    updateDisplay();
    scheduleValidationHint(HINT_DELAY_ACTION);

    nextTick(() => setCaretToDigitPosition(result.caretDigitIndex));
  };

  const handleFocus = () => {
    // Do not hide the hint on focus; keep it visible if already shown
    validationTimer.clear();
  };

  /** Clear/reset function */
  const clear = () => {
    digits.value = '';
    displayValue.value = '';
    showValidationHint.value = false;
    validationTimer.clear();
  };

  // Watch for country changes and update display
  watch(selected, () => {
    // Truncate digits if new country has lower max
    if (digits.value.length > maxDigits.value) {
      digits.value = digits.value.slice(0, maxDigits.value);
    }
    updateDisplay();
  });

  // Initialize display
  updateDisplay();

  return {
    // State
    digits,
    displayValue,

    // Computed
    displayPlaceholder,
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
    updateDisplayFromDigits: updateDisplay,
    clear
  };
}
