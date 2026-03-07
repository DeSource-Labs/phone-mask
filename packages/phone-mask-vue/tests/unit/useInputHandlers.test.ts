/// <reference types="vitest/globals" />
import { shallowRef } from 'vue';
import { createPhoneFormatter, getCountry } from '@desource/phone-mask';
import { useInputHandlers } from '@src/composables/internal/useInputHandlers';
import { testUseInputHandlers, type SetupOptions } from '@common/tests/unit/useInputHandlers';
import { tools, withSetup } from './setup/tools';

function setup(options: SetupOptions = {}) {
  const { digits: initialDigits = '', inactive: initialInactive = false } = options;

  const onChange = vi.fn();
  const scheduleValidationHint = vi.fn();
  const formatter = createPhoneFormatter(getCountry('US', 'en'));

  const inputEl = document.createElement('input');
  document.body.appendChild(inputEl);

  const digitsRef = shallowRef(initialDigits);
  const inactiveRef = shallowRef(initialInactive);

  const { result, unmount: composableUnmount } = withSetup(() =>
    useInputHandlers({
      formatter,
      digits: digitsRef,
      inactive: inactiveRef,
      onChange,
      scheduleValidationHint
    })
  );

  inputEl.addEventListener('beforeinput', (e) => result.handleBeforeInput(e as InputEvent));
  inputEl.addEventListener('input', (e) => result.handleInput(e));
  inputEl.addEventListener('keydown', (e) => result.handleKeydown(e as KeyboardEvent));
  inputEl.addEventListener('paste', (e) => result.handlePaste(e as ClipboardEvent));

  return {
    unmount: () => {
      document.body.removeChild(inputEl);
      composableUnmount();
    },
    rerender: ({ digits, inactive }: { digits?: string; inactive?: boolean }) => {
      if (digits !== undefined) digitsRef.value = digits;
      if (inactive !== undefined) inactiveRef.value = inactive;
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
