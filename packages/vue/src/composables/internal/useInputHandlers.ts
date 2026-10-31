import { nextTick, toValue, type MaybeRefOrGetter } from 'vue';
import type { CountryKey } from '@desource/phone-mask';
import {
  processBeforeInput,
  processInput,
  processKeydown,
  processPaste,
  setCaret,
  type FormatterHelpers
} from '@desource/phone-mask/kit';

export interface UseInputHandlersOptions {
  formatter: MaybeRefOrGetter<FormatterHelpers>;
  digits: MaybeRefOrGetter<string>;
  inactive?: MaybeRefOrGetter<boolean>;
  onChange?: (newDigits: string) => void;
  onEdit?: (country?: CountryKey) => void;
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
  const { formatter, digits, inactive, onChange, onEdit, scheduleValidationHint } = options;

  const apply = (e: Event, result: ReturnType<typeof processPaste>, delay: number) => {
    if (!result) return;
    onEdit?.(result.country);
    onChange?.(result.newDigits);
    const el = e.target as HTMLInputElement | null;
    nextTick(() => {
      if (!el) return;
      const pos = toValue(formatter).getCaretPosition(result.caretDigitIndex, result.newDigits.length);
      setCaret(el, pos);
    });
    scheduleValidationHint?.(delay);
  };

  const handleBeforeInput = (e: InputEvent) => {
    processBeforeInput(e);
  };

  const handleInput = (e: Event) => {
    if (toValue(inactive)) return;

    apply(e, processInput(e, { formatter: toValue(formatter) }), HINT_DELAY_INPUT);
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (toValue(inactive)) return;

    apply(e, processKeydown(e, { digits: toValue(digits), formatter: toValue(formatter) }), HINT_DELAY_ACTION);
  };

  const handlePaste = (e: ClipboardEvent) => {
    if (toValue(inactive)) return;

    apply(e, processPaste(e, { digits: toValue(digits), formatter: toValue(formatter) }), HINT_DELAY_ACTION);
  };

  return {
    handleBeforeInput,
    handleInput,
    handleKeydown,
    handlePaste
  };
}
