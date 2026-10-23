import React, { useCallback } from 'react';
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
  formatter: FormatterHelpers;
  digits: string;
  inactive?: boolean;
  onChange?: (newDigits: string) => void;
  onEdit?: (country?: CountryKey) => void;
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
  const { formatter, digits, inactive, onChange, onEdit, scheduleValidationHint } = options;

  const apply = useCallback(
    (evt: Event, result: ReturnType<typeof processPaste>, delay: number) => {
      if (!result) return;
      onEdit?.(result.country);
      onChange?.(result.newDigits);
      const el = evt.target as HTMLInputElement | null;
      setTimeout(() => {
        if (el) setCaret(el, result.country ? el.value.length : formatter.getCaretPosition(result.caretDigitIndex));
      });
      scheduleValidationHint?.(delay);
    },
    [formatter, onChange, onEdit, scheduleValidationHint]
  );

  const handleBeforeInput = useCallback((e: React.SyntheticEvent<HTMLInputElement> | InputEvent) => {
    processBeforeInput(getNativeEvent(e) as InputEvent);
  }, []);

  const handleInput = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement> | Event) => {
      if (inactive) return;

      const evt = getNativeEvent(e);
      apply(evt, processInput(evt, { formatter }), HINT_DELAY_INPUT);
    },
    [inactive, formatter, apply]
  );

  const handleKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement> | KeyboardEvent) => {
      if (inactive) return;

      const evt = getNativeEvent(e) as KeyboardEvent;
      apply(evt, processKeydown(evt, { digits, formatter }), HINT_DELAY_ACTION);
    },
    [inactive, digits, formatter, apply]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement> | ClipboardEvent) => {
      if (inactive) return;

      const evt = getNativeEvent(e) as ClipboardEvent;
      apply(evt, processPaste(evt, { digits, formatter }), HINT_DELAY_ACTION);
    },
    [inactive, digits, formatter, apply]
  );

  return {
    handleBeforeInput,
    handleInput,
    handleKeydown,
    handlePaste
  };
}
