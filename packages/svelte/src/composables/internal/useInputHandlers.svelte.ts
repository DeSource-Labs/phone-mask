import { tick } from 'svelte';
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
  formatter: () => FormatterHelpers;
  digits: () => string;
  inactive?: () => boolean;
  onChange?: (newDigits: string) => void;
  onCountryChange?: (country: CountryKey) => void;
  onEdit?: () => void;
  scheduleValidationHint?: (delay: number) => void;
}

const HINT_DELAY_INPUT = 500;
const HINT_DELAY_ACTION = 300;

/**
 * Svelte composable that provides event handlers for phone input masking.
 */
export function useInputHandlers(options: UseInputHandlersOptions) {
  const { formatter, digits, inactive, onChange, onCountryChange, onEdit, scheduleValidationHint } = options;

  const apply = (e: Event, result: ReturnType<typeof processPaste>, delay: number) => {
    if (!result) return;
    onEdit?.();
    if (result.country) onCountryChange?.(result.country);
    onChange?.(result.newDigits);
    const el = e.target as HTMLInputElement | null;
    tick().then(() => {
      if (!el) return;
      const pos = formatter().getCaretPosition(result.caretDigitIndex);
      setCaret(el, pos);
    });
    scheduleValidationHint?.(delay);
  };

  const handleBeforeInput = (e: InputEvent) => {
    processBeforeInput(e);
  };

  const handleInput = (e: Event) => {
    if (inactive?.()) return;

    apply(e, processInput(e, { formatter: formatter() }), HINT_DELAY_INPUT);
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (inactive?.()) return;

    apply(e, processKeydown(e, { digits: digits(), formatter: formatter() }), HINT_DELAY_ACTION);
  };

  const handlePaste = (e: ClipboardEvent) => {
    if (inactive?.()) return;

    apply(e, processPaste(e, { digits: digits(), formatter: formatter() }), HINT_DELAY_ACTION);
  };

  return {
    handleBeforeInput,
    handleInput,
    handleKeydown,
    handlePaste
  };
}
