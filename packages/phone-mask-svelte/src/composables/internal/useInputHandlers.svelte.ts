import { tick } from 'svelte';
import {
  processBeforeInput,
  processInput,
  processKeydown,
  processPaste,
  setCaret,
  type FormatterHelpers
} from '@desource/phone-mask';

export interface UseInputHandlersOptions {
  formatter: () => FormatterHelpers;
  digits: () => string;
  inactive?: () => boolean;
  onChange?: (newDigits: string) => void;
  scheduleValidationHint?: (delay: number) => void;
}

const HINT_DELAY_INPUT = 500;
const HINT_DELAY_ACTION = 300;

/**
 * Svelte composable that provides event handlers for phone input masking.
 */
export function useInputHandlers(options: UseInputHandlersOptions) {
  const { formatter, digits, inactive, onChange, scheduleValidationHint } = options;

  const scheduleCaretUpdate = (el: HTMLInputElement | null, digitIndex: number) => {
    tick().then(() => {
      if (!el) return;
      const pos = formatter().getCaretPosition(digitIndex);
      setCaret(el, pos);
    });
  };

  const handleBeforeInput = (e: InputEvent) => {
    processBeforeInput(e);
  };

  const handleInput = (e: Event) => {
    if (inactive?.()) return;

    const result = processInput(e, { formatter: formatter() });
    if (!result) return;

    onChange?.(result.newDigits);
    scheduleCaretUpdate(e.target as HTMLInputElement | null, result.caretDigitIndex);
    scheduleValidationHint?.(HINT_DELAY_INPUT);
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (inactive?.()) return;

    const result = processKeydown(e, { digits: digits(), formatter: formatter() });
    if (!result) return;

    onChange?.(result.newDigits);
    scheduleCaretUpdate(e.target as HTMLInputElement | null, result.caretDigitIndex);
    scheduleValidationHint?.(HINT_DELAY_ACTION);
  };

  const handlePaste = (e: ClipboardEvent) => {
    if (inactive?.()) return;

    const result = processPaste(e, { digits: digits(), formatter: formatter() });
    if (!result) return;

    onChange?.(result.newDigits);
    scheduleCaretUpdate(e.target as HTMLInputElement | null, result.caretDigitIndex);
    scheduleValidationHint?.(HINT_DELAY_ACTION);
  };

  return {
    handleBeforeInput,
    handleInput,
    handleKeydown,
    handlePaste
  };
}
