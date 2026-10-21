/// <reference types="vitest/globals" />
import { shallowRef } from 'vue';
import { createPhoneFormatter, getCountry } from '@desource/phone-mask/kit';
import { useInputHandlers } from '@src/composables/internal/useInputHandlers';
import { createInputHandlersSetup, testUseInputHandlers, type SetupOptions } from '@common/tests/unit/useInputHandlers';
import { tools, withSetup } from './setup/tools';

function setup(options: SetupOptions = {}) {
  const { digits: initialDigits = '', inactive: initialInactive = false } = options;

  return createInputHandlersSetup(({ onChange, scheduleValidationHint }) => {
    const formatter = createPhoneFormatter(getCountry('US', 'en'));
    const digitsRef = shallowRef(initialDigits);
    const inactiveRef = shallowRef(initialInactive);
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
        if (digits !== undefined) digitsRef.value = digits;
        if (inactive !== undefined) inactiveRef.value = inactive;
      }
    };
  });
}

testUseInputHandlers(setup, tools);
