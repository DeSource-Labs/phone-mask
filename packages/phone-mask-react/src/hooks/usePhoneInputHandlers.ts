import React, { useCallback } from 'react';
import {
  processBeforeInput,
  processInput,
  processKeydown,
  processPaste,
  type FormatterHelpers
} from '@desource/phone-mask';

export interface UsePhoneInputHandlersOptions {
  formatter: FormatterHelpers;
  digits: string;
  inactive?: boolean;
  onChange: (newDigits: string) => void;
  onCaretUpdate: (digitIndex: number) => void;
  // Optional callbacks for side effects
  onAfterInput?: () => void;
  onAfterKeydown?: () => void;
  onAfterPaste?: () => void;
}

type ReactHTMLInputEvent<T extends Event> = T | React.SyntheticEvent<HTMLInputElement, T>;

export interface UsePhoneInputHandlersReturn {
  handleBeforeInput: (e: ReactHTMLInputEvent<InputEvent>) => void;
  handleInput: (e: ReactHTMLInputEvent<Event>) => void;
  handleKeydown: (e: ReactHTMLInputEvent<KeyboardEvent>) => void;
  handlePaste: (e: ReactHTMLInputEvent<ClipboardEvent>) => void;
}

/**
 * React hook that provides event handlers for phone input masking.
 * Handlers are compatible with both native events and React synthetic events.
 */
export function usePhoneInputHandlers(options: UsePhoneInputHandlersOptions): UsePhoneInputHandlersReturn {
  const { formatter, digits, inactive, onChange, onCaretUpdate, onAfterInput, onAfterKeydown, onAfterPaste } = options;

  // helpers to extract native event from React synthetic event if needed
  const getEvent = <T extends Event>(e: ReactHTMLInputEvent<T>) => {
    return 'nativeEvent' in e ? e.nativeEvent : e;
  };

  const handleBeforeInput = (e: ReactHTMLInputEvent<InputEvent>) => {
    processBeforeInput(getEvent(e));
  };

  const handleInput = useCallback(
    (e: ReactHTMLInputEvent<Event>) => {
      if (inactive) return;

      const result = processInput(getEvent(e), { formatter });

      if (!result) return;

      onChange(result.newDigits);
      onCaretUpdate(result.caretDigitIndex);

      onAfterInput?.();
    },
    [inactive, formatter, onChange, onCaretUpdate, onAfterInput]
  );

  const handleKeydown = useCallback(
    (e: ReactHTMLInputEvent<KeyboardEvent>) => {
      if (inactive) return;

      const result = processKeydown(getEvent(e), { currentDigits: digits, formatter });

      if (!result) return;

      onChange(result.newDigits);
      onCaretUpdate(result.caretDigitIndex);

      onAfterKeydown?.();
    },
    [inactive, digits, formatter, onChange, onCaretUpdate, onAfterKeydown]
  );

  const handlePaste = useCallback(
    (e: ReactHTMLInputEvent<ClipboardEvent>) => {
      if (inactive) return;

      const result = processPaste(getEvent(e), {
        currentDigits: digits,
        formatter
      });

      if (!result) return;

      onChange(result.newDigits);
      onCaretUpdate(result.caretDigitIndex);

      onAfterPaste?.();
    },
    [inactive, digits, formatter, onChange, onCaretUpdate, onAfterPaste]
  );

  return {
    handleBeforeInput,
    handleInput,
    handleKeydown,
    handlePaste
  };
}
