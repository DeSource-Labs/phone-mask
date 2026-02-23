import React, { useCallback } from 'react';
import {
  processBeforeInput,
  processInput,
  processKeydown,
  processPaste,
  setCaret,
  type FormatterHelpers
} from '@desource/phone-mask';

export interface UseInputHandlersOptions {
  formatter: FormatterHelpers;
  digits: string;
  inactive?: boolean;
  onChange?: (newDigits: string) => void;
  scheduleValidationHint?: (delay: number) => void;
}

export interface UseInputHandlersReturn {
  handleBeforeInput: (e: React.SyntheticEvent<HTMLInputElement> | InputEvent) => void;
  handleInput: (e: React.SyntheticEvent<HTMLInputElement> | Event) => void;
  handleKeydown: (e: React.KeyboardEvent<HTMLInputElement> | KeyboardEvent) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLInputElement> | ClipboardEvent) => void;
}

// Extract native event from React synthetic event, or return event as-is
function getNativeEvent(e: React.SyntheticEvent | Event): Event {
  return 'nativeEvent' in e ? e.nativeEvent : e;
}

const HINT_DELAY_INPUT = 500;
const HINT_DELAY_ACTION = 300;

/**
 * React hook that provides event handlers for phone input masking.
 * Handlers are compatible with both native events and React synthetic events.
 */
export function useInputHandlers(options: UseInputHandlersOptions): UseInputHandlersReturn {
  const { formatter, digits, inactive, onChange, scheduleValidationHint } = options;

  // Helper: Schedule caret position update
  const scheduleCaretUpdate = useCallback(
    (el: HTMLInputElement | null, digitIndex: number) => {
      setTimeout(() => {
        if (!el) return;
        const pos = formatter.getCaretPosition(digitIndex);
        setCaret(el, pos);
      }, 0);
    },
    [formatter]
  );

  const handleBeforeInput = useCallback((e: React.SyntheticEvent<HTMLInputElement> | InputEvent) => {
    processBeforeInput(getNativeEvent(e) as InputEvent);
  }, []);

  const handleInput = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement> | Event) => {
      if (inactive) return;

      const evt = getNativeEvent(e);
      const result = processInput(evt, { formatter });

      if (!result) return;

      onChange?.(result.newDigits);
      scheduleCaretUpdate(evt.target as HTMLInputElement | null, result.caretDigitIndex);
      scheduleValidationHint?.(HINT_DELAY_INPUT);
    },
    [inactive, formatter, onChange, scheduleCaretUpdate, scheduleValidationHint]
  );

  const handleKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement> | KeyboardEvent) => {
      if (inactive) return;

      const evt = getNativeEvent(e) as KeyboardEvent;
      const result = processKeydown(evt, { digits, formatter });

      if (!result) return;

      onChange?.(result.newDigits);
      scheduleCaretUpdate(evt.target as HTMLInputElement | null, result.caretDigitIndex);
      scheduleValidationHint?.(HINT_DELAY_ACTION);
    },
    [inactive, digits, formatter, onChange, scheduleCaretUpdate, scheduleValidationHint]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement> | ClipboardEvent) => {
      if (inactive) return;

      const evt = getNativeEvent(e) as ClipboardEvent;
      const result = processPaste(evt, { digits, formatter });

      if (!result) return;

      onChange?.(result.newDigits);
      scheduleCaretUpdate(evt.target as HTMLInputElement | null, result.caretDigitIndex);
      scheduleValidationHint?.(HINT_DELAY_ACTION);
    },
    [inactive, digits, formatter, onChange, scheduleCaretUpdate, scheduleValidationHint]
  );

  return {
    handleBeforeInput,
    handleInput,
    handleKeydown,
    handlePaste
  };
}
