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
  inputEl.addEventListener('beforeinput', (e) => result.handleBeforeInput(e));
  inputEl.addEventListener('input', (e) => result.handleInput(e));
  inputEl.addEventListener('keydown', (e) => result.handleKeydown(e));
  inputEl.addEventListener('paste', (e) => result.handlePaste(e));

  return {
    result,
    unmount: () => {
      inputEl.remove();
      hookUnmount();
    },
    rerender: ({ digits, inactive }: { digits?: string; inactive?: boolean }) => {
      if (digits !== undefined) currentDigits = digits;
      if (inactive !== undefined) currentInactive = inactive;
      rerenderHook({ digits: currentDigits, inactive: currentInactive });
    },
    onChange,
    scheduleValidationHint,
    inputEl,
    invokeInputWithoutTarget: () => {
      result.handleInput({ target: null } as unknown as Event);
    }
  };
}

testUseInputHandlers(setup, tools);
