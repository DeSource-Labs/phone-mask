// Mask/digits formatting and input handling
import { ref, computed, watch, nextTick } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import { setCaret, extractDigits, getSelection, type MaskFull } from '@desource/phone-mask';

import { createPhoneFormatter } from './usePhoneFormatter';
import { Delimiters, NavigationKeys, InvalidPattern } from '../consts';

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

  /** Remove range of digits */
  const removeDigitsRange = (startIdx: number, endIdx: number) => {
    if (startIdx >= endIdx) return;
    digits.value = digits.value.slice(0, startIdx) + digits.value.slice(endIdx);
  };

  const handleBeforeInput = (e: InputEvent) => {
    const el = e.target as HTMLInputElement;
    if (!el) return;

    const data = e.data;
    if (e.inputType !== 'insertText' || !data) return;

    // Block invalid characters & multiple spaces (to prevent autocomplete issues)
    if (InvalidPattern.test(data) || (data === ' ' && el.value.endsWith(' '))) {
      e.preventDefault();
    }
  };

  const handleInput = (e: Event) => {
    const el = e.target as HTMLInputElement;
    if (!el) return;

    const newDigits = extractDigits(el.value, maxDigits.value);

    // Clear validation hint while typing (will reappear after debounce)
    showValidationHint.value = false;
    if (validationTimer.value) {
      clearTimeout(validationTimer.value);
    }

    digits.value = newDigits;
    updateDisplay();

    // Show validation hint after 500ms of no typing (if incomplete)
    if (newDigits.length > 0) {
      validationTimer.value = setTimeout(() => {
        showValidationHint.value = true;
      }, 500);
    }

    nextTick(() => {
      setCaretToDigitPosition(digits.value.length);
    });
  };

  const handleKeydownInternal = (e: KeyboardEvent) => {
    const el = telRef.value ?? (e.target as HTMLInputElement | null);
    if (!el) return;

    // Allow meta & navigation keys
    if (e.ctrlKey || e.metaKey || e.altKey || NavigationKeys.includes(e.key)) return;

    const [selStart, selEnd] = getSelection(el);

    // Backspace
    if (e.key === 'Backspace') {
      e.preventDefault();

      if (selStart !== selEnd) {
        // Delete selection
        const range = formatter.value.getDigitRange(digits.value, selStart, selEnd);
        if (range) {
          const [start, end] = range;
          removeDigitsRange(start, end);
          updateDisplay();
          nextTick(() => setCaretToDigitPosition(start));
        }
        return;
      }

      // Delete single character before caret
      if (selStart > 0) {
        const displayStr = displayValue.value;
        // Find previous digit position
        let prevPos = selStart - 1;
        while (prevPos >= 0 && Delimiters.includes(displayStr[prevPos]!)) {
          prevPos--;
        }

        if (prevPos >= 0) {
          const range = formatter.value.getDigitRange(digits.value, prevPos, prevPos + 1);
          if (range) {
            const [start] = range;
            removeDigitsRange(start, start + 1);
            updateDisplay();
            nextTick(() => setCaretToDigitPosition(start));
          }
        }
      }
      return;
    }

    // Delete key
    if (e.key === 'Delete') {
      e.preventDefault();

      if (selStart !== selEnd) {
        const range = formatter.value.getDigitRange(digits.value, selStart, selEnd);
        if (range) {
          const [start, end] = range;
          removeDigitsRange(start, end);
          updateDisplay();
          nextTick(() => setCaretToDigitPosition(start));
        }
        return;
      }

      // Delete character at caret
      if (selStart < displayValue.value.length) {
        const range = formatter.value.getDigitRange(digits.value, selStart, selStart + 1);
        if (range) {
          const [start] = range;
          removeDigitsRange(start, start + 1);
          updateDisplay();
          nextTick(() => setCaretToDigitPosition(start));
        }
      }
      return;
    }

    // Block input if max digits reached
    if (/^[0-9]$/.test(e.key)) {
      if (digits.value.length >= maxDigits.value) {
        e.preventDefault();
      }
      return;
    }

    // Block non-numeric input
    if (e.key.length === 1) {
      e.preventDefault();
    }
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
    e.preventDefault();

    const text = e.clipboardData?.getData('text') || '';
    const pastedDigits = extractDigits(text, maxDigits.value);

    if (pastedDigits.length === 0) return;

    const el = telRef.value;
    if (!el) return;

    const [selStart, selEnd] = getSelection(el);

    if (selStart !== selEnd) {
      // Replace selection with pasted content
      const range = formatter.value.getDigitRange(digits.value, selStart, selEnd);
      if (range) {
        const [start, end] = range;
        const left = digits.value.slice(0, start);
        const right = digits.value.slice(end);
        digits.value = extractDigits(left + pastedDigits + right, maxDigits.value);
        updateDisplay();
        nextTick(() => setCaretToDigitPosition(start + pastedDigits.length));
        return;
      }
    }

    // Insert at current position
    const range = formatter.value.getDigitRange(digits.value, selStart, selStart);
    const insertIndex = range ? range[0] : digits.value.length;

    const left = digits.value.slice(0, insertIndex);
    const right = digits.value.slice(insertIndex);
    digits.value = extractDigits(left + pastedDigits + right, maxDigits.value);
    updateDisplay();
    // Trigger validation hint shortly after paste if incomplete
    if (validationTimer.value) clearTimeout(validationTimer.value);
    validationTimer.value = setTimeout(() => {
      if (!isComplete.value && !isEmpty.value) showValidationHint.value = true;
    }, 300);
    nextTick(() => setCaretToDigitPosition(insertIndex + pastedDigits.length));
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
