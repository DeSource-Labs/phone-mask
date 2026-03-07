/// <reference types="vitest/globals" />
import { createPhoneFormatter, getCountry } from '@desource/phone-mask';
import { useInputHandlers } from '../../../src/composables/internal/useInputHandlers.svelte';
import { testUseInputHandlers, type SetupOptions } from '@common/tests/unit/useInputHandlers';
import { tools, withSetup, createState } from '../setup/tools.svelte';

function setup(options: SetupOptions = {}) {
  const { digits: initialDigits = '', inactive: initialInactive = false } = options;

  const onChange = vi.fn();
  const scheduleValidationHint = vi.fn();
  const formatter = createPhoneFormatter(getCountry('US', 'en'));

  const inputEl = document.createElement('input');
  document.body.appendChild(inputEl);

  const digitsState = createState(initialDigits);
  const inactiveState = createState(initialInactive);

  const { result, unmount: composableUnmount } = withSetup(() =>
    useInputHandlers({
      formatter: () => formatter,
      digits: () => digitsState.value,
      inactive: () => inactiveState.value,
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
      if (digits !== undefined) digitsState.value = digits;
      if (inactive !== undefined) inactiveState.value = inactive;
    },
    onChange,
    scheduleValidationHint,
    inputEl
  };
}

testUseInputHandlers(setup, tools);
