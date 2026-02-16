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

export function useMask(selected: ComputedRef<MaskFull>, telRef: Ref<HTMLInputElement | null>) {
  const digits = ref('');
  const displayValue = ref('');
  const validationTimer = ref<ReturnType<typeof setTimeout> | null>(null);
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

  const handleBeforeInput = processBeforeInput;

  const handleInput = (e: Event) => {
    const result = processInput(e, { formatter: formatter.value });
    if (!result) return;

    // Clear validation hint while typing (will reappear after debounce)
    showValidationHint.value = false;
    if (validationTimer.value) {
      clearTimeout(validationTimer.value);
    }

    digits.value = result.newDigits;
    updateDisplay();

    // Show validation hint after 500ms of no typing (if incomplete)
    if (result.newDigits.length > 0) {
      validationTimer.value = setTimeout(() => {
        showValidationHint.value = true;
      }, 500);
    }

    nextTick(() => {
      setCaretToDigitPosition(result.caretDigitIndex);
    });
  };

  const handleKeydownInternal = (e: KeyboardEvent) => {
    const result = processKeydown(e, {
      currentDigits: digits.value,
      formatter: formatter.value
    });

    if (!result) return;

    digits.value = result.newDigits;
    updateDisplay();
    nextTick(() => setCaretToDigitPosition(result.caretDigitIndex));
  };

  const handleKeydown = (e: KeyboardEvent) => {
    // Clear validation hint while typing (will reappear after debounce)
    showValidationHint.value = false;
    if (validationTimer.value) {
      clearTimeout(validationTimer.value);
    }
    handleKeydownInternal(e);
    // Trigger validation hint shortly after keydown if incomplete
    if (validationTimer.value) clearTimeout(validationTimer.value);
    validationTimer.value = setTimeout(() => {
      if (!isComplete.value && !isEmpty.value) showValidationHint.value = true;
    }, 300);
  };

  const handlePaste = (e: ClipboardEvent) => {
    const result = processPaste(e, {
      currentDigits: digits.value,
      formatter: formatter.value
    });

    if (!result) return;

    digits.value = result.newDigits;
    updateDisplay();

    // Trigger validation hint shortly after paste if incomplete
    if (validationTimer.value) clearTimeout(validationTimer.value);
    validationTimer.value = setTimeout(() => {
      if (!isComplete.value && !isEmpty.value) showValidationHint.value = true;
    }, 300);

    nextTick(() => setCaretToDigitPosition(result.caretDigitIndex));
  };

  const handleFocus = () => {
    // Do not hide the hint on focus; keep it visible if already shown
    if (validationTimer.value) {
      clearTimeout(validationTimer.value);
    }
  };

  /** Clear/reset function */
  const clear = () => {
    digits.value = '';
    displayValue.value = '';
    showValidationHint.value = false;
    if (validationTimer.value) {
      clearTimeout(validationTimer.value);
      validationTimer.value = null;
    }
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
