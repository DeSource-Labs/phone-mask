/// <reference types="vitest/globals" />
import type { Mock } from 'vitest';

import type { TestTools } from './setup/tools';

export interface SetupOptions {
  /** Initial digits string. Defaults to ''. */
  digits?: string;
  /** Whether the input is inactive. Defaults to false. */
  inactive?: boolean;
}

export interface InputHandlersSetupResult {
  unmount: () => void;
  rerender: (props: SetupOptions) => void;
  onChange: Mock;
  scheduleValidationHint: Mock;
  /**
   * Input element connected to the composable/hook via event listeners.
   * Dispatch events to this element to trigger the handlers under test.
   */
  inputEl: HTMLInputElement;
}

export type SetupFn = (options?: SetupOptions) => InputHandlersSetupResult;

// US mask: "###-###-####", max 10 digits
const DIGITS_COMPLETE = '2345678901';
const DISPLAY_COMPLETE = '234-567-8901';
const HINT_DELAY_INPUT = 500;
const HINT_DELAY_ACTION = 300;

function makeBeforeInputEvent(data: string | null): InputEvent {
  return new InputEvent('beforeinput', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data
  });
}

function makePasteEvent(text: string): ClipboardEvent {
  // ClipboardEvent is not implemented in JSDOM — use a plain Event cast instead.
  // processPaste only reads e.target, e.preventDefault(), and e.clipboardData?.getData('text').
  const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    value: { getData: () => text },
    configurable: true
  });
  return event;
}

export function testUseInputHandlers(setup: SetupFn, { act }: TestTools): void {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('useInputHandlers', () => {
    // ------------------------------------------------------------------ //
    // handleBeforeInput
    // ------------------------------------------------------------------ //
    describe('handleBeforeInput', () => {
      it('does not call preventDefault for a valid digit', async () => {
        const { inputEl, unmount } = setup();
        const event = makeBeforeInputEvent('5');
        const spy = vi.spyOn(event, 'preventDefault');

        await act(async () => {
          inputEl.dispatchEvent(event);
        });

        expect(spy).not.toHaveBeenCalled();
        unmount();
      });

      it('calls preventDefault for an invalid character', async () => {
        const { inputEl, unmount } = setup();
        const event = makeBeforeInputEvent('a');
        const spy = vi.spyOn(event, 'preventDefault');

        await act(async () => {
          inputEl.dispatchEvent(event);
        });

        expect(spy).toHaveBeenCalledOnce();
        unmount();
      });

      it('calls preventDefault when inserting a space after a trailing space', async () => {
        const { inputEl, unmount } = setup();
        inputEl.value = '+1 ';
        const event = makeBeforeInputEvent(' ');
        const spy = vi.spyOn(event, 'preventDefault');

        await act(async () => {
          inputEl.dispatchEvent(event);
        });

        expect(spy).toHaveBeenCalledOnce();
        unmount();
      });

      it('does not call onChange', async () => {
        const { inputEl, onChange, unmount } = setup();

        await act(async () => {
          inputEl.dispatchEvent(makeBeforeInputEvent('5'));
        });

        expect(onChange).not.toHaveBeenCalled();
        unmount();
      });

      it('does not call scheduleValidationHint', async () => {
        const { inputEl, scheduleValidationHint, unmount } = setup();

        await act(async () => {
          inputEl.dispatchEvent(makeBeforeInputEvent('5'));
        });

        expect(scheduleValidationHint).not.toHaveBeenCalled();
        unmount();
      });
    });

    // ------------------------------------------------------------------ //
    // handleInput
    // ------------------------------------------------------------------ //
    describe('handleInput', () => {
      it('calls onChange with digits extracted from the input value', async () => {
        const { inputEl, onChange, unmount } = setup();

        await act(async () => {
          inputEl.value = DISPLAY_COMPLETE;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        });

        expect(onChange).toHaveBeenCalledWith(DIGITS_COMPLETE);
        unmount();
      });

      it('calls scheduleValidationHint with HINT_DELAY_INPUT', async () => {
        const { inputEl, scheduleValidationHint, unmount } = setup();

        await act(async () => {
          inputEl.value = DISPLAY_COMPLETE;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        });

        expect(scheduleValidationHint).toHaveBeenCalledWith(HINT_DELAY_INPUT);
        unmount();
      });

      it('does nothing when inactive', async () => {
        const { inputEl, onChange, scheduleValidationHint, unmount } = setup({ inactive: true });

        await act(async () => {
          inputEl.value = DISPLAY_COMPLETE;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        });

        expect(onChange).not.toHaveBeenCalled();
        expect(scheduleValidationHint).not.toHaveBeenCalled();
        unmount();
      });

      it('does nothing when inactive after rerender', async () => {
        const { inputEl, onChange, rerender, unmount } = setup({ inactive: false });

        await act(async () => {
          rerender({ inactive: true });
        });

        await act(async () => {
          inputEl.value = DISPLAY_COMPLETE;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        });

        expect(onChange).not.toHaveBeenCalled();
        unmount();
      });
    });

    // ------------------------------------------------------------------ //
    // handleKeydown
    // ------------------------------------------------------------------ //
    describe('handleKeydown', () => {
      it('does nothing when inactive', async () => {
        const { inputEl, onChange, unmount } = setup({ digits: DIGITS_COMPLETE, inactive: true });

        await act(async () => {
          inputEl.value = DISPLAY_COMPLETE;
          inputEl.selectionStart = DISPLAY_COMPLETE.length;
          inputEl.selectionEnd = DISPLAY_COMPLETE.length;
          inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
        });

        expect(onChange).not.toHaveBeenCalled();
        unmount();
      });

      it('calls onChange with last digit removed on Backspace at end', async () => {
        const { inputEl, onChange, unmount } = setup({ digits: DIGITS_COMPLETE });

        await act(async () => {
          inputEl.value = DISPLAY_COMPLETE;
          inputEl.selectionStart = DISPLAY_COMPLETE.length;
          inputEl.selectionEnd = DISPLAY_COMPLETE.length;
          inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
        });

        expect(onChange).toHaveBeenCalledWith(DIGITS_COMPLETE.slice(0, -1));
        unmount();
      });

      it('calls onChange with first digit removed on Delete at start', async () => {
        const { inputEl, onChange, unmount } = setup({ digits: DIGITS_COMPLETE });

        await act(async () => {
          inputEl.value = DISPLAY_COMPLETE;
          inputEl.selectionStart = 0;
          inputEl.selectionEnd = 0;
          inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }));
        });

        expect(onChange).toHaveBeenCalledWith(DIGITS_COMPLETE.slice(1));
        unmount();
      });

      it('calls scheduleValidationHint with HINT_DELAY_ACTION when a digit is deleted', async () => {
        const { inputEl, scheduleValidationHint, unmount } = setup({ digits: DIGITS_COMPLETE });

        await act(async () => {
          inputEl.value = DISPLAY_COMPLETE;
          inputEl.selectionStart = DISPLAY_COMPLETE.length;
          inputEl.selectionEnd = DISPLAY_COMPLETE.length;
          inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
        });

        expect(scheduleValidationHint).toHaveBeenCalledWith(HINT_DELAY_ACTION);
        unmount();
      });

      it('does not call onChange for navigation keys', async () => {
        const { inputEl, onChange, unmount } = setup({ digits: DIGITS_COMPLETE });

        await act(async () => {
          for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab']) {
            inputEl.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
          }
        });

        expect(onChange).not.toHaveBeenCalled();
        unmount();
      });

      it('does not call onChange on Backspace when digits is empty', async () => {
        const { inputEl, onChange, unmount } = setup({ digits: '' });

        await act(async () => {
          inputEl.value = '';
          inputEl.selectionStart = 0;
          inputEl.selectionEnd = 0;
          inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
        });

        expect(onChange).not.toHaveBeenCalled();
        unmount();
      });
    });

    // ------------------------------------------------------------------ //
    // handlePaste
    // ------------------------------------------------------------------ //
    describe('handlePaste', () => {
      it('calls onChange with digits extracted from pasted text', async () => {
        const { inputEl, onChange, unmount } = setup();

        await act(async () => {
          inputEl.selectionStart = 0;
          inputEl.selectionEnd = 0;
          inputEl.dispatchEvent(makePasteEvent(DISPLAY_COMPLETE));
        });

        expect(onChange).toHaveBeenCalledWith(DIGITS_COMPLETE);
        unmount();
      });

      it('inserts pasted digits at collapsed caret position instead of appending to end', async () => {
        const { inputEl, onChange, unmount } = setup({ digits: '234567' });

        await act(async () => {
          inputEl.value = '234-567';
          inputEl.selectionStart = 4;
          inputEl.selectionEnd = 4;
          inputEl.dispatchEvent(makePasteEvent('99'));
        });

        expect(onChange).toHaveBeenCalledWith('23499567');
        unmount();
      });

      it('calls scheduleValidationHint with HINT_DELAY_ACTION', async () => {
        const { inputEl, scheduleValidationHint, unmount } = setup();

        await act(async () => {
          inputEl.selectionStart = 0;
          inputEl.selectionEnd = 0;
          inputEl.dispatchEvent(makePasteEvent(DISPLAY_COMPLETE));
        });

        expect(scheduleValidationHint).toHaveBeenCalledWith(HINT_DELAY_ACTION);
        unmount();
      });

      it('does nothing when inactive', async () => {
        const { inputEl, onChange, scheduleValidationHint, unmount } = setup({ inactive: true });

        await act(async () => {
          inputEl.selectionStart = 0;
          inputEl.selectionEnd = 0;
          inputEl.dispatchEvent(makePasteEvent(DISPLAY_COMPLETE));
        });

        expect(onChange).not.toHaveBeenCalled();
        expect(scheduleValidationHint).not.toHaveBeenCalled();
        unmount();
      });

      it('does not call onChange when pasted text contains no digits', async () => {
        const { inputEl, onChange, unmount } = setup();

        await act(async () => {
          inputEl.selectionStart = 0;
          inputEl.selectionEnd = 0;
          inputEl.dispatchEvent(makePasteEvent('--- ---'));
        });

        expect(onChange).not.toHaveBeenCalled();
        unmount();
      });

      it('clamps pasted digits to maxDigits', async () => {
        const { inputEl, onChange, unmount } = setup();

        await act(async () => {
          inputEl.selectionStart = 0;
          inputEl.selectionEnd = 0;
          // 12 digits total — must be clamped to 10
          inputEl.dispatchEvent(makePasteEvent('234 567 8901 11'));
        });

        expect(onChange).toHaveBeenCalledWith(DIGITS_COMPLETE);
        unmount();
      });
    });
  });
}
