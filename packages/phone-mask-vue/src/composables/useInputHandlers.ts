import { nextTick, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  processBeforeInput,
  processInput,
  processKeydown,
  processPaste,
  setCaret,
  type FormatterHelpers
} from '@desource/phone-mask';

export interface UseInputHandlersOptions {
  formatter: MaybeRefOrGetter<FormatterHelpers>;
  digits: MaybeRefOrGetter<string>;
  inactive?: MaybeRefOrGetter<boolean>;
  onChange?: (newDigits: string) => void;
  scheduleValidationHint?: (delay: number) => void;
}

export interface UseInputHandlersReturn {
  handleBeforeInput: (e: InputEvent) => void;
  handleInput: (e: Event) => void;
  handleKeydown: (e: KeyboardEvent) => void;
  handlePaste: (e: ClipboardEvent) => void;
}

const HINT_DELAY_INPUT = 500;
const HINT_DELAY_ACTION = 300;

/**
 * Vue composable that provides event handlers for phone input masking.
 */
export function useInputHandlers(options: UseInputHandlersOptions): UseInputHandlersReturn {
  const { formatter, digits, inactive, onChange, scheduleValidationHint } = options;

  const scheduleCaretUpdate = (el: HTMLInputElement | null, digitIndex: number) => {
    nextTick(() => {
      if (!el) return;
      const pos = toValue(formatter).getCaretPosition(digitIndex);
      setCaret(el, pos);
    });
  };

  const handleBeforeInput = (e: InputEvent) => {
    processBeforeInput(e);
  };

  const handleInput = (e: Event) => {
    if (toValue(inactive)) return;

    const result = processInput(e, { formatter: toValue(formatter) });
    if (!result) return;

    onChange?.(result.newDigits);
    scheduleCaretUpdate(e.target as HTMLInputElement | null, result.caretDigitIndex);
    scheduleValidationHint?.(HINT_DELAY_INPUT);
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (toValue(inactive)) return;

    const result = processKeydown(e, { digits: toValue(digits), formatter: toValue(formatter) });
    if (!result) return;

    onChange?.(result.newDigits);
    scheduleCaretUpdate(e.target as HTMLInputElement | null, result.caretDigitIndex);
    scheduleValidationHint?.(HINT_DELAY_ACTION);
  };

  const handlePaste = (e: ClipboardEvent) => {
    if (toValue(inactive)) return;

    const result = processPaste(e, { digits: toValue(digits), formatter: toValue(formatter) });
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
