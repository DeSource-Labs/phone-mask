/// <reference types="vitest/globals" />
import { getCountry } from '@desource/phone-mask';
import { useFormatter } from '../../../src/composables/internal/useFormatter.svelte';
import { testUseFormatter, type SetupOptions } from '@common/tests/unit/useFormatter';
import { tools, withSetup, createState } from '../setup/tools.svelte';

function setup(options: SetupOptions = {}) {
  const { countryCode = 'US', value: initialValue = '' } = options;

  const countryCodeState = createState(countryCode);
  const valueState = createState(initialValue);

  const onChange = vi.fn();
  const onPhoneChange = vi.fn();
  const onValidationChange = vi.fn();

  const { result, unmount } = withSetup(() =>
    useFormatter({
      country: () => getCountry(countryCodeState.value, 'en'),
      value: () => valueState.value,
      onChange,
      onPhoneChange,
      onValidationChange
    })
  );

  return {
    result,
    unmount,
    rerender: ({ value, countryCode: code }: { value?: string; countryCode?: string }) => {
      if (value !== undefined) valueState.value = value;
      if (code !== undefined) countryCodeState.value = code;
    },
    onChange,
    onPhoneChange,
    onValidationChange
  };
}

testUseFormatter(setup, tools);
