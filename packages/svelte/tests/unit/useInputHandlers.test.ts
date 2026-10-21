/// <reference types="vitest/globals" />
import { createPhoneFormatter, getCountry } from '@desource/phone-mask/kit';
import { useInputHandlers } from '@src/composables/internal/useInputHandlers.svelte';
import { createInputHandlersSetup, testUseInputHandlers, type SetupOptions } from '@common/tests/unit/useInputHandlers';
import { tools, withSetup, createState } from './setup/tools.svelte';

function setup(options: SetupOptions = {}) {
  const { digits: initialDigits = '', inactive: initialInactive = false } = options;

  return createInputHandlersSetup(({ onChange, scheduleValidationHint }) => {
    const formatter = createPhoneFormatter(getCountry('US', 'en'));
    const digitsState = createState(initialDigits);
    const inactiveState = createState(initialInactive);
    const { result, unmount } = withSetup(() =>
      useInputHandlers({
        formatter: () => formatter,
        digits: () => digitsState.value,
        inactive: () => inactiveState.value,
        onChange,
        scheduleValidationHint
      })
    );

    return {
      result,
      unmount,
      rerender: ({ digits, inactive }) => {
        if (digits !== undefined) digitsState.value = digits;
        if (inactive !== undefined) inactiveState.value = inactive;
      }
    };
  });
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
