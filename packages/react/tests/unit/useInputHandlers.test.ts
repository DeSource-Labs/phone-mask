/// <reference types="vitest/globals" />
import { createPhoneFormatter, getCountry } from '@desource/phone-mask/kit';
import { useInputHandlers } from '@src/hooks/internal/useInputHandlers';
import { createInputHandlersSetup, testUseInputHandlers, type SetupOptions } from '@common/tests/unit/useInputHandlers';
import { tools, renderHookWithProxy } from './setup/tools';

function setup(options: SetupOptions = {}) {
  const { digits: initialDigits = '', inactive: initialInactive = false } = options;

  return createInputHandlersSetup(({ onChange, scheduleValidationHint }) => {
    const formatter = createPhoneFormatter(getCountry('US', 'en'));
    let currentDigits = initialDigits;
    let currentInactive = initialInactive;
    const { result, unmount, rerender } = renderHookWithProxy(
      ({ digits, inactive }: { digits: string; inactive: boolean }) =>
        useInputHandlers({ formatter, digits, inactive, onChange, scheduleValidationHint }),
      { initialProps: { digits: initialDigits, inactive: initialInactive } }
    );

    return {
      result,
      unmount,
      rerender: ({ digits, inactive }) => {
        if (digits !== undefined) currentDigits = digits;
        if (inactive !== undefined) currentInactive = inactive;
        rerender({ digits: currentDigits, inactive: currentInactive });
      }
    };
  });
}

testUseInputHandlers(setup, tools);
