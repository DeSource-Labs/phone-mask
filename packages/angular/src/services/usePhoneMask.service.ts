import { afterRenderEffect } from '@angular/core';
import type { UsePhoneMaskOptions, UsePhoneMaskReturn } from '../types';
import { useCountry } from './internal/useCountry.service';
import { useFormatter } from './internal/useFormatter.service';
import { useInputHandlers } from './internal/useInputHandlers.service';

/** Create per-input state in an Angular injection context; the caller owns the digits. */
export function usePhoneMask(options: UsePhoneMaskOptions): UsePhoneMaskReturn {
  const inputRef = options.input ?? (() => null);
  const { country, locale, setCountry } = useCountry(options);
  const state = useFormatter({ ...options, country });
  const handlers = useInputHandlers({
    formatter: state.formatter,
    digits: state.digits,
    inactive: () => !!(inputRef()?.disabled || inputRef()?.readOnly),
    onChange: options.onChange
  });

  afterRenderEffect({
    write: () => {
      const input = inputRef();
      if (!input) return;
      input.type = 'tel';
      input.inputMode = 'tel';
      const display = state.displayValue();
      if (input.value !== display) input.value = display;
      input.placeholder = state.displayPlaceholder();
    }
  });

  afterRenderEffect((onCleanup) => {
    const input = inputRef();
    if (!input) return;
    const { handleBeforeInput, handleInput, handleKeydown, handlePaste } = handlers;
    input.addEventListener('beforeinput', handleBeforeInput);
    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleKeydown);
    input.addEventListener('paste', handlePaste);
    onCleanup(() => {
      input.removeEventListener('beforeinput', handleBeforeInput);
      input.removeEventListener('input', handleInput);
      input.removeEventListener('keydown', handleKeydown);
      input.removeEventListener('paste', handlePaste);
    });
  });

  return { ...state, country, locale, setCountry, clear: () => options.onChange('') };
}
