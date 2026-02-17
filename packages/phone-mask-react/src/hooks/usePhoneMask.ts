import { useRef, useEffect, useCallback, useState } from 'react';
import { extractDigits, getSelection } from '../utils';
import { Delimiters, InvalidPattern, NavigationKeys } from '../consts';
import { usePhoneMaskCore } from './usePhoneMaskCore';

import type { UsePhoneMaskOptions, UsePhoneMaskReturn } from '../types';

/**
 * React hook for phone number masking.
 * Provides low-level phone masking functionality for custom input implementations.
 */
export function usePhoneMask(options: UsePhoneMaskOptions = {}): UsePhoneMaskReturn {
  const inputRef = useRef<HTMLInputElement>(null);

  // Local state for digits (uncontrolled mode at this level)
  const [localDigits, setDigits] = useState<string>('');

  const {
    digits,
    country,
    formatter,
    displayValue,
    full,
    fullFormatted,
    isComplete,
    isEmpty,
    shouldShowWarn,
    setCountry,
    scheduleCaretUpdate
  } = usePhoneMaskCore({
    value: localDigits, // Pass local state as controlled value
    ...options
  });

  // Clamp digits formatter changes
  useEffect(() => {
    const maxDigits = formatter.getMaxDigits();
    if (localDigits.length > maxDigits) {
      setDigits(localDigits.slice(0, maxDigits));
    }
  }, [formatter, localDigits]);

  // Update display when digits or country change
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    el.value = displayValue;
    el.placeholder = formatter.getPlaceholder();
  }, [displayValue, formatter]);

  // Event handler: beforeinput
  const handleBeforeInput = useCallback((e: InputEvent) => {
    const data = e.data;
    if (e.inputType !== 'insertText' || !data) return;

    const el = inputRef.current;
    if (!el) return;

    // Block invalid characters & multiple spaces
    if (InvalidPattern.test(data) || (data === ' ' && el.value.endsWith(' '))) {
      e.preventDefault();
    }
  }, []);

  // Event handler: input
  const handleInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;

    const raw = el.value || '';
    const maxDigits = formatter.getMaxDigits();
    const newDigits = extractDigits(raw, maxDigits);

    setDigits(newDigits);
    scheduleCaretUpdate(el, newDigits.length);
  }, [formatter, scheduleCaretUpdate]);

  // Event handler: keydown
  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      const el = inputRef.current;
      if (!el) return;

      // Allow meta & navigation keys
      if (e.ctrlKey || e.metaKey || e.altKey || NavigationKeys.includes(e.key)) return;

      const [selStart, selEnd] = getSelection(el);

      if (e.key === 'Backspace') {
        e.preventDefault();

        if (selStart !== selEnd) {
          const range = formatter.getDigitRange(digits, selStart, selEnd);
          if (range) {
            const [start, end] = range;
            const newDigits = digits.slice(0, start) + digits.slice(end);
            setDigits(newDigits);
            scheduleCaretUpdate(el, start);
          }
          return;
        }

        if (selStart > 0) {
          const displayStr = el.value;
          let prevPos = selStart - 1;
          while (prevPos >= 0 && Delimiters.includes(displayStr[prevPos]!)) {
            prevPos--;
          }

          if (prevPos >= 0) {
            const range = formatter.getDigitRange(digits, prevPos, prevPos + 1);
            if (range) {
              const [start] = range;
              const newDigits = digits.slice(0, start) + digits.slice(start + 1);
              setDigits(newDigits);
              scheduleCaretUpdate(el, start);
            }
          }
        }
        return;
      }

      if (e.key === 'Delete') {
        e.preventDefault();

        if (selStart !== selEnd) {
          const range = formatter.getDigitRange(digits, selStart, selEnd);
          if (range) {
            const [start, end] = range;
            const newDigits = digits.slice(0, start) + digits.slice(end);
            setDigits(newDigits);
            scheduleCaretUpdate(el, start);
          }
          return;
        }

        if (selStart < el.value.length) {
          const range = formatter.getDigitRange(digits, selStart, selStart + 1);
          if (range) {
            const [start] = range;
            const newDigits = digits.slice(0, start) + digits.slice(start + 1);
            setDigits(newDigits);
            scheduleCaretUpdate(el, start);
          }
        }
        return;
      }

      // Block max digits
      if (/^[0-9]$/.test(e.key)) {
        if (digits.length >= formatter.getMaxDigits()) {
          e.preventDefault();
        }
        return;
      }

      // Block non-numeric
      if (e.key.length === 1) {
        e.preventDefault();
      }
    },
    [digits, formatter, scheduleCaretUpdate]
  );

  // Event handler: paste
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      e.preventDefault();

      const el = inputRef.current;
      if (!el) return;

      const text = e.clipboardData?.getData('text') || '';
      const maxDigits = formatter.getMaxDigits();
      const pastedDigits = extractDigits(text, maxDigits);

      if (pastedDigits.length === 0) return;

      const [selStart, selEnd] = getSelection(el);

      if (selStart !== selEnd) {
        const range = formatter.getDigitRange(digits, selStart, selEnd);

        if (range) {
          const [start, end] = range;
          const left = digits.slice(0, start);
          const right = digits.slice(end);
          const newDigits = extractDigits(left + pastedDigits + right, maxDigits);
          setDigits(newDigits);
          scheduleCaretUpdate(el, start + pastedDigits.length);
          return;
        }
      }

      const range = formatter.getDigitRange(digits, selStart, selStart);
      const insertIndex = range ? range[0] : digits.length;

      const left = digits.slice(0, insertIndex);
      const right = digits.slice(insertIndex);
      const newDigits = extractDigits(left + pastedDigits + right, maxDigits);
      setDigits(newDigits);
      scheduleCaretUpdate(el, insertIndex + pastedDigits.length);
    },
    [digits, formatter, scheduleCaretUpdate]
  );

  // Attach event listeners
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    el.setAttribute('type', 'tel');
    el.setAttribute('inputmode', 'tel');
    el.setAttribute('placeholder', formatter.getPlaceholder());

    const beforeInputHandler = handleBeforeInput as unknown as (evt: Event) => void;
    const keydownHandler = handleKeydown as unknown as (evt: Event) => void;
    const pasteHandler = handlePaste as unknown as (evt: Event) => void;

    el.addEventListener('beforeinput', beforeInputHandler);
    el.addEventListener('input', handleInput);
    el.addEventListener('keydown', keydownHandler);
    el.addEventListener('paste', pasteHandler);

    return () => {
      el.removeEventListener('beforeinput', beforeInputHandler);
      el.removeEventListener('input', handleInput);
      el.removeEventListener('keydown', keydownHandler);
      el.removeEventListener('paste', pasteHandler);
    };
  }, [handleBeforeInput, handleInput, handleKeydown, handlePaste, formatter]);

  const clear = useCallback(() => {
    setDigits('');
    const el = inputRef.current;
    if (el) {
      el.value = '';
    }
  }, []);

  return {
    ref: inputRef,
    digits,
    full,
    fullFormatted,
    isComplete,
    isEmpty,
    shouldShowWarn,
    country,
    setCountry,
    clear
  };
}
