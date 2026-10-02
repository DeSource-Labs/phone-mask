// Framework-agnostic input handling utilities for phone mask inputs
// These pure functions can be used across any framework (React, Vue, etc.)
import type { FormatterHelpers } from './formatter';

export const DELIMITERS = [' ', '-', '(', ')'];
export const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab'];
export const INVALID_PATTERN = /[^\d\s\-()]/;

/** Result of processInput */
interface InputResult {
  newDigits: string;
  caretDigitIndex: number;
}

/** Result of processKeydown */
interface KeydownResult {
  newDigits: string;
  caretDigitIndex: number;
}

/** Result of processPaste */
interface PasteResult {
  newDigits: string;
  caretDigitIndex: number;
}

/** Parameters for processInput */
interface ProcessInputParams {
  formatter: FormatterHelpers;
}

/** Parameters for processKeydown */
interface ProcessKeydownParams {
  digits: string;
  formatter: FormatterHelpers;
}

/** Parameters for processPaste */
interface ProcessPasteParams {
  digits: string;
  formatter: FormatterHelpers;
}

function getSafeKey(e: KeyboardEvent): string {
  return typeof e.key === 'string' ? e.key : '';
}

function shouldIgnoreKeydown(e: KeyboardEvent, key: string): boolean {
  return !key || e.ctrlKey || e.metaKey || e.altKey || NAVIGATION_KEYS.includes(key);
}

function removeDigitsRange(digits: string, start: number, end: number): KeydownResult {
  return {
    newDigits: digits.slice(0, start) + digits.slice(end),
    caretDigitIndex: start
  };
}

function removeSelectedDigits(
  digits: string,
  formatter: FormatterHelpers,
  selectionStart: number,
  selectionEnd: number
): KeydownResult | undefined {
  if (selectionStart === selectionEnd) return;

  const range = formatter.getDigitRange(digits, selectionStart, selectionEnd);
  if (!range) return;

  const [start, end] = range;
  return removeDigitsRange(digits, start, end);
}

function removePreviousDigit(
  digits: string,
  formatter: FormatterHelpers,
  displayValue: string,
  selectionStart: number
): KeydownResult | undefined {
  if (selectionStart <= 0) return;

  // Find previous digit position (skip delimiters)
  let prevPos = selectionStart - 1;
  while (prevPos >= 0 && DELIMITERS.includes(displayValue[prevPos])) {
    prevPos--;
  }

  if (prevPos < 0) return;

  const range = formatter.getDigitRange(digits, prevPos, prevPos + 1);
  if (!range) return;

  const [start] = range;
  return removeDigitsRange(digits, start, start + 1);
}

function removeNextDigit(
  digits: string,
  formatter: FormatterHelpers,
  displayValue: string,
  selectionStart: number
): KeydownResult | undefined {
  if (selectionStart >= displayValue.length) return;

  // Skip delimiters and delete the next actual digit by finding
  // the first digit index at/after the caret in a single range lookup.
  const range = formatter.getDigitRange(digits, selectionStart, displayValue.length);
  if (!range) return;

  const [start] = range;
  return removeDigitsRange(digits, start, start + 1);
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
  const key = getSafeKey(e); // Normalize key to empty string if it's not a string (e.g. auto-complete)

  const { digits, formatter } = params;

  // Allow autocomplete, meta & navigation keys
  if (shouldIgnoreKeydown(e, key)) return;

  const [selectionStart, selectionEnd] = getSelection(el);
  const displayValue = el.value;

  // Handle Backspace
  if (key === 'Backspace') {
    e.preventDefault();
    return (
      removeSelectedDigits(digits, formatter, selectionStart, selectionEnd) ??
      removePreviousDigit(digits, formatter, displayValue, selectionStart)
    );
  }

  // Handle Delete
  if (key === 'Delete') {
    e.preventDefault();
    return (
      removeSelectedDigits(digits, formatter, selectionStart, selectionEnd) ??
      removeNextDigit(digits, formatter, displayValue, selectionStart)
    );
  }

  // Handle digits
  if (/^\d$/.test(key)) {
    if (digits.length >= formatter.getMaxDigits()) {
      e.preventDefault();
    }
    return;
  }

  // Block non-numeric single characters
  if (key.length === 1) {
    e.preventDefault();
  }
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
    return;
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

  // Insert at cursor position.
  // `getDigitRange(selStart, selStart)` is always empty for collapsed carets,
  // so derive insertion index from the digit range before the caret.
  const beforeCaretRange = formatter.getDigitRange(digits, 0, selectionStart);
  const insertIndex = beforeCaretRange ? beforeCaretRange[1] : 0;

  const left = digits.slice(0, insertIndex);
  const right = digits.slice(insertIndex);
  const newDigits = extractDigits(left + pastedDigits + right, maxDigits);

  return {
    newDigits,
    caretDigitIndex: insertIndex + pastedDigits.length
  };
}
