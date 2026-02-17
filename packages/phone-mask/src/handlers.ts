// Framework-agnostic input handling utilities for phone mask inputs
// These pure functions can be used across any framework (React, Vue, etc.)

import type { FormatterHelpers } from './formatter';

export const DELIMITERS = [' ', '-', '(', ')'];
export const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab'];
export const INVALID_PATTERN = /[^\d\s\-()]/;

/**
 * Result of processInput
 */
interface InputResult {
  newDigits: string;
  caretDigitIndex: number;
}

/**
 * Result of processKeydown
 */
interface KeydownResult {
  newDigits: string;
  caretDigitIndex: number;
}

/**
 * Result of processPaste
 */
interface PasteResult {
  newDigits: string;
  caretDigitIndex: number;
}

/**
 * Parameters for processInput
 */
interface ProcessInputParams {
  formatter: FormatterHelpers;
}

/**
 * Parameters for processKeydown
 */
interface ProcessKeydownParams {
  digits: string;
  formatter: FormatterHelpers;
}

/**
 * Parameters for processPaste
 */
interface ProcessPasteParams {
  digits: string;
  formatter: FormatterHelpers;
}

/**
 * Extract digits from a string, optionally limiting to maxLength
 */
export function extractDigits(value: string, maxLength?: number): string {
  const digits = value.replace(/\D/g, '');
  return maxLength ? digits.slice(0, maxLength) : digits;
}

/**
 * Get current selection range from input element
 */
export function getSelection(el: HTMLInputElement | null): [number, number] {
  if (!el) return [0, 0];
  return [el.selectionStart ?? 0, el.selectionEnd ?? 0];
}

/**
 * Set caret position in input element
 */
export function setCaret(el: HTMLInputElement | null, position: number): void {
  if (!el) return;
  try {
    el.setSelectionRange(position, position);
  } catch {
    // Silently fail if element doesn't support selection
  }
}

/**
 * Process beforeinput event - determine if input should be blocked
 */
export function processBeforeInput(e: InputEvent): void {
  if (!e.target) return;

  const el = e.target as HTMLInputElement;
  const data = e.data;

  if (e.inputType !== 'insertText' || !data) return;

  // Block invalid characters & multiple spaces
  if (INVALID_PATTERN.test(data) || (data === ' ' && el.value.endsWith(' '))) {
    e.preventDefault();
  }
}

/**
 * Process input event - extract digits and calculate caret position
 */
export function processInput(e: Event, params: ProcessInputParams): InputResult | undefined {
  if (!e.target) return;

  const el = e.target as HTMLInputElement;

  const { formatter } = params;

  const maxDigits = formatter.getMaxDigits();
  const newDigits = extractDigits(el.value, maxDigits);

  return {
    newDigits,
    caretDigitIndex: newDigits.length
  };
}

/**
 * Process keydown event - handle backspace, delete, digits, etc.
 */
export function processKeydown(e: KeyboardEvent, params: ProcessKeydownParams): KeydownResult | undefined {
  if (!e.target) return;

  const el = e.target as HTMLInputElement;

  const { digits, formatter } = params;

  // Allow meta & navigation keys
  if (e.ctrlKey || e.metaKey || e.altKey || NAVIGATION_KEYS.includes(e.key)) return;

  const [selectionStart, selectionEnd] = getSelection(el);

  // Handle Backspace
  if (e.key === 'Backspace') {
    e.preventDefault();
    // Selection deletion
    if (selectionStart !== selectionEnd) {
      const range = formatter.getDigitRange(digits, selectionStart, selectionEnd);
      if (range) {
        const [start, end] = range;
        const newDigits = digits.slice(0, start) + digits.slice(end);
        return {
          newDigits,
          caretDigitIndex: start
        };
      }
    }

    // Single character deletion
    if (selectionStart > 0) {
      const displayStr = el.value;
      // Find previous digit position (skip delimiters)
      let prevPos = selectionStart - 1;
      while (prevPos >= 0 && DELIMITERS.includes(displayStr[prevPos]!)) {
        prevPos--;
      }

      if (prevPos >= 0) {
        const range = formatter.getDigitRange(digits, prevPos, prevPos + 1);
        if (range) {
          const [start] = range;
          const newDigits = digits.slice(0, start) + digits.slice(start + 1);
          return {
            newDigits,
            caretDigitIndex: start
          };
        }
      }
    }

    return;
  }

  // Handle Delete
  if (e.key === 'Delete') {
    e.preventDefault();

    // Selection deletion
    if (selectionStart !== selectionEnd) {
      const range = formatter.getDigitRange(digits, selectionStart, selectionEnd);
      if (range) {
        const [start, end] = range;
        const newDigits = digits.slice(0, start) + digits.slice(end);
        return {
          newDigits,
          caretDigitIndex: start
        };
      }
    }

    // Single character deletion
    if (selectionStart < el.value.length) {
      const range = formatter.getDigitRange(digits, selectionStart, selectionStart + 1);
      if (range) {
        const [start] = range;
        const newDigits = digits.slice(0, start) + digits.slice(start + 1);
        return {
          newDigits,
          caretDigitIndex: start
        };
      }
    }

    return;
  }

  // Handle digits
  if (/^[0-9]$/.test(e.key)) {
    if (digits.length >= formatter.getMaxDigits()) {
      e.preventDefault();
    }
    return;
  }

  // Block non-numeric single characters
  if (e.key.length === 1) {
    e.preventDefault();
  }

  return;
}

/**
 * Process paste event - extract digits and insert at correct position
 */
export function processPaste(e: ClipboardEvent, params: ProcessPasteParams): PasteResult | undefined {
  if (!e.target) return;

  e.preventDefault();

  const el = e.target as HTMLInputElement;

  const { digits, formatter } = params;

  const text = e.clipboardData?.getData('text') || '';
  const maxDigits = formatter.getMaxDigits();
  const pastedDigits = extractDigits(text, maxDigits);

  if (pastedDigits.length === 0) {
    return {
      newDigits: digits,
      caretDigitIndex: digits.length
    };
  }

  const [selectionStart, selectionEnd] = getSelection(el);

  // Replace selection with pasted digits
  if (selectionStart !== selectionEnd) {
    const range = formatter.getDigitRange(digits, selectionStart, selectionEnd);

    if (range) {
      const [start, end] = range;
      const left = digits.slice(0, start);
      const right = digits.slice(end);
      const newDigits = extractDigits(left + pastedDigits + right, maxDigits);

      return {
        newDigits,
        caretDigitIndex: start + pastedDigits.length
      };
    }
  }

  // Insert at cursor position
  const range = formatter.getDigitRange(digits, selectionStart, selectionStart);
  const insertIndex = range ? range[0] : digits.length;

  const left = digits.slice(0, insertIndex);
  const right = digits.slice(insertIndex);
  const newDigits = extractDigits(left + pastedDigits + right, maxDigits);

  return {
    newDigits,
    caretDigitIndex: insertIndex + pastedDigits.length
  };
}
