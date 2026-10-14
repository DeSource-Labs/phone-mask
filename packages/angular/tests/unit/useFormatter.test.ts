/// <reference types="vitest/globals" />
import { signal } from '@angular/core';
import { getCountry } from '@desource/phone-mask/kit';
import { useFormatter } from '@src/services/internal/useFormatter.service';
import { testUseFormatter, type SetupOptions } from '@common/tests/unit/useFormatter';
import { tools, withSetup } from './setup/tools';

function setup(options: SetupOptions = {}) {
  const { countryCode = 'US', value: initialValue = '' } = options;

  const countryCodeRef = signal(countryCode);
  const valueRef = signal(initialValue);

  const onChange = vi.fn();
  const onPhoneChange = vi.fn();
  const onValidationChange = vi.fn();

  const { result, unmount } = withSetup(() =>
    useFormatter({
      country: () => getCountry(countryCodeRef(), 'en'),
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
      if (value !== undefined) valueRef.set(value);
      if (code !== undefined) countryCodeRef.set(code);
    },
    onChange,
    onPhoneChange,
    onValidationChange
  };
}

testUseFormatter(setup, tools);
