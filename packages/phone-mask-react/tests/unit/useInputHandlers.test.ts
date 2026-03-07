/// <reference types="vitest/globals" />
import { createPhoneFormatter, getCountry } from '@desource/phone-mask';
import { useInputHandlers } from '../../src/hooks/internal/useInputHandlers';
import { testUseInputHandlers, type SetupOptions } from '@common/tests/unit/useInputHandlers';
import { tools, renderHookWithProxy } from './setup/tools';

function setup(options: SetupOptions = {}) {
  const { digits: initialDigits = '', inactive: initialInactive = false } = options;

  const onChange = vi.fn();
  const scheduleValidationHint = vi.fn();
  const formatter = createPhoneFormatter(getCountry('US', 'en'));

  const inputEl = document.createElement('input');
  document.body.appendChild(inputEl);

  let currentDigits = initialDigits;
  let currentInactive = initialInactive;

  const {
    result,
    unmount: hookUnmount,
    rerender: rerenderHook
  } = renderHookWithProxy(
    ({ digits, inactive }: { digits: string; inactive: boolean }) =>
      useInputHandlers({ formatter, digits, inactive, onChange, scheduleValidationHint }),
    { initialProps: { digits: initialDigits, inactive: initialInactive } }
  );

  // Always delegate to the latest handler via result (proxy) so re-renders are reflected
  inputEl.addEventListener('beforeinput', (e) => result.handleBeforeInput(e as InputEvent));
  inputEl.addEventListener('input', (e) => result.handleInput(e));
  inputEl.addEventListener('keydown', (e) => result.handleKeydown(e as KeyboardEvent));
  inputEl.addEventListener('paste', (e) => result.handlePaste(e as ClipboardEvent));

  return {
    result,
    unmount: () => {
      document.body.removeChild(inputEl);
      hookUnmount();
    },
    rerender: ({ digits, inactive }: { digits?: string; inactive?: boolean }) => {
      if (digits !== undefined) currentDigits = digits;
      if (inactive !== undefined) currentInactive = inactive;
      rerenderHook({ digits: currentDigits, inactive: currentInactive });
    },
    onChange,
    scheduleValidationHint,
    inputEl
  };
}

testUseInputHandlers(setup, tools);

describe('useInputHandlers caret scheduling (React)', () => {
  it('updates caret position after input processing', async () => {
    vi.useFakeTimers();
    const { inputEl, unmount } = setup();

    try {
      await tools.act(async () => {
        inputEl.value = '234-567-8901';
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      });

      vi.runAllTimers();
      expect(inputEl.selectionStart).toBe(inputEl.selectionEnd);
      expect(inputEl.selectionStart).toBe(12);
    } finally {
      unmount();
      vi.useRealTimers();
    }
  });
});
