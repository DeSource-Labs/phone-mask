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
    displayPlaceholder,
    displayValue,
    full,
    fullFormatted,
    isComplete,
    isEmpty,
    shouldShowWarn,
    setCountry
  } = useMaskCore({
    value: localDigits, // Pass local state as controlled value
    onChange: setDigits, // Update local state on change
    country: options.country,
    locale: options.locale,
    detect: options.detect,
    onPhoneChange: options.onChange, // Emit phone change with full data
    onCountryChange: options.onCountryChange
  });

  // Use consolidated input handlers
  const { handleBeforeInput, handleInput, handleKeydown, handlePaste } = useInputHandlers({
    formatter,
    digits,
    onChange: setDigits
  });

  // after mount, set input type to tel for better experience
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.setAttribute('type', 'tel');
    el.setAttribute('inputmode', 'tel');
  }, []);

  // Update display when digits or placeholder changes
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    el.value = displayValue;

    el.setAttribute('placeholder', displayPlaceholder);
  }, [displayValue, displayPlaceholder]);

  // Attach event listeners
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

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
  }, [handleBeforeInput, handleInput, handleKeydown, handlePaste]);

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
