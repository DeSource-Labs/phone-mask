/// <reference types="vitest/globals" />
import { createPhoneFormatter, getCountry } from '@desource/phone-mask';
import { useInputHandlers } from '@src/composables/internal/useInputHandlers.svelte';
import { testUseInputHandlers, type SetupOptions } from '@common/tests/unit/useInputHandlers';
import { tools, withSetup, createState } from './setup/tools.svelte';

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

  inputEl.addEventListener('beforeinput', (e) => result.handleBeforeInput(e));
  inputEl.addEventListener('input', (e) => result.handleInput(e));
  inputEl.addEventListener('keydown', (e) => result.handleKeydown(e));
  inputEl.addEventListener('paste', (e) => result.handlePaste(e));

  return {
    result,
    unmount: () => {
      inputEl.remove();
      composableUnmount();
    },
    rerender: ({ digits, inactive }: { digits?: string; inactive?: boolean }) => {
      if (digits !== undefined) digitsState.value = digits;
      if (inactive !== undefined) inactiveState.value = inactive;
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

describe('useInputHandlers (Svelte specifics)', () => {
  it('runs deferred caret update path after input event', async () => {
    const { inputEl, onChange, unmount } = setup();
    const setSelectionRangeSpy = vi.spyOn(inputEl, 'setSelectionRange');

    try {
      await tools.act(async () => {
        inputEl.value = '202-555-0199';
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      });

      await Promise.resolve();
      await tools.act(async () => {});

      expect(onChange).toHaveBeenCalledWith('2025550199');
      expect(setSelectionRangeSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
    } finally {
      unmount();
    }
  });
});
