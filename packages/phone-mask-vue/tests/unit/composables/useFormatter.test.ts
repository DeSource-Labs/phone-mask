/// <reference types="vitest/globals" />
import { ref } from 'vue';
import { getCountry } from '@desource/phone-mask';
import { useFormatter } from '../../../src/composables/internal/useFormatter';
import { testUseFormatter, type SetupOptions } from '@common/tests/unit/useFormatter';
import { tools, withSetup } from '../setup/tools';

function setup(options: SetupOptions = {}) {
  const { countryCode = 'US', value: initialValue = '' } = options;

  const countryCodeRef = ref(countryCode);
  const valueRef = ref(initialValue);

  const onChange = vi.fn();
  const onPhoneChange = vi.fn();
  const onValidationChange = vi.fn();

  const { result, unmount } = withSetup(() =>
    useFormatter({
      country: () => getCountry(countryCodeRef.value, 'en'),
      value: valueRef,
      onChange,
      onPhoneChange,
      onValidationChange
    })
  );

  return {
    result,
    unmount,
    rerender: ({ value, countryCode: code }: { value?: string; countryCode?: string }) => {
      if (value !== undefined) valueRef.value = value;
      if (code !== undefined) countryCodeRef.value = code;
    },
    onChange,
    onPhoneChange,
    onValidationChange
  };
}

testUseFormatter(setup, tools);
