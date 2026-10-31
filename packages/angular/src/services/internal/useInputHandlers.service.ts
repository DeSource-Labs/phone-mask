import {
  processBeforeInput,
  processInput,
  processKeydown,
  processPaste,
  setCaret,
  type FormatterHelpers
} from '@desource/phone-mask/kit';
import type { CountryKey } from '@desource/phone-mask';
import type { MaybeGetter } from '../../types';
import { readOption } from '../utility/readOption';

export interface UseInputHandlersOptions {
  formatter: MaybeGetter<FormatterHelpers>;
  digits: MaybeGetter<string>;
  inactive?: MaybeGetter<boolean>;
  onEdit?: (country?: CountryKey) => void;
  onChange?: (digits: string) => void;
  scheduleValidationHint?: (delay: number) => void;
}

export function useInputHandlers({
  formatter,
  digits,
  inactive,
  onEdit,
  onChange,
  scheduleValidationHint
}: UseInputHandlersOptions) {
  const apply = (event: Event, result: ReturnType<typeof processPaste>, delay: number) => {
    if (!result) return;
    onEdit?.(result.country);
    onChange?.(result.newDigits);
    const input = event.target as HTMLInputElement | null;
    if (input) {
      const mask = readOption(formatter);
      input.value = mask.formatDisplay(result.newDigits);
      setCaret(input, mask.getCaretPosition(result.caretDigitIndex, result.newDigits.length));
    }
    scheduleValidationHint?.(delay);
  };

  const handleInput = (event: Event) => {
    if (readOption(inactive)) return;
    apply(event, processInput(event, { formatter: readOption(formatter) }), 500);
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (readOption(inactive)) return;
    apply(event, processKeydown(event, { digits: readOption(digits), formatter: readOption(formatter) }), 300);
  };

  const handlePaste = (event: ClipboardEvent) => {
    if (readOption(inactive)) return;
    apply(event, processPaste(event, { digits: readOption(digits), formatter: readOption(formatter) }), 300);
  };

  return { handleBeforeInput: processBeforeInput, handleInput, handleKeydown, handlePaste };
}
