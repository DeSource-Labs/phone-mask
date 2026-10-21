/// <reference types="vitest/globals" />
import { signal } from '@angular/core';
import { createPhoneFormatter, getCountry } from '@desource/phone-mask/kit';
import { useInputHandlers } from '@src/services/internal/useInputHandlers.service';
import { createInputHandlersSetup, testUseInputHandlers, type SetupOptions } from '@common/tests/unit/useInputHandlers';
import { tools, withSetup } from './setup/tools';

function setup(options: SetupOptions = {}) {
  const { digits: initialDigits = '', inactive: initialInactive = false } = options;

  return createInputHandlersSetup(({ onChange, scheduleValidationHint }) => {
    const formatter = createPhoneFormatter(getCountry('US', 'en'));
    const digitsRef = signal(initialDigits);
    const inactiveRef = signal(initialInactive);
    const { result, unmount } = withSetup(() =>
      useInputHandlers({
        formatter,
        digits: digitsRef,
        inactive: inactiveRef,
        onChange,
        scheduleValidationHint
      })
    );

    return {
      result,
      unmount,
      rerender: ({ digits, inactive }) => {
        if (digits !== undefined) digitsRef.set(digits);
        if (inactive !== undefined) inactiveRef.set(inactive);
      }
    };
  });
}

testUseInputHandlers(setup, tools);
