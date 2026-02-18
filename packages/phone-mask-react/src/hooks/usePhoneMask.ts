import { useRef, useEffect, useCallback, useState } from 'react';
import { useMaskCore } from './useMaskCore';
import { useInputHandlers } from './useInputHandlers';

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
    setCountry
  } = useMaskCore({
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

  // Use consolidated input handlers
  const { handleBeforeInput, handleInput, handleKeydown, handlePaste } = useInputHandlers({
    formatter,
    digits,
    onChange: setDigits
  });

  // Attach event listeners
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    el.setAttribute('type', 'tel');
    el.setAttribute('inputmode', 'tel');
    el.setAttribute('placeholder', formatter.getPlaceholder());

    const beforeInputHandler = handleBeforeInput;
    const inputHandler = handleInput;
    const keydownHandler = handleKeydown;
    const pasteHandler = handlePaste;

    el.addEventListener('beforeinput', beforeInputHandler);
    el.addEventListener('input', inputHandler);
    el.addEventListener('keydown', keydownHandler);
    el.addEventListener('paste', pasteHandler);

    return () => {
      el.removeEventListener('beforeinput', beforeInputHandler);
      el.removeEventListener('input', inputHandler);
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
