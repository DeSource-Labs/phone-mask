/// <reference types="vitest/globals" />
import { render } from '@testing-library/svelte';
import PhoneInput from '../../src/components/PhoneInput.svelte';
import type { PhoneInputExposed } from '../../src/types';
import { testPhoneInput } from '@common/tests/unit/PhoneInput';
import { tools } from './setup/tools.svelte';
import type { SetupFn } from '@common/tests/unit/PhoneInput';

const setup: SetupFn = (options = {}) => {
  const onChange = vi.fn();
  const onCountryChange = vi.fn();

  const { container, unmount, component } = render(PhoneInput, {
    props: {
      value: options.value ?? '',
      detect: options.detect ?? false,
      showClear: options.showClear,
      onchange: (data) => onChange(data.digits),
      oncountrychange: onCountryChange
    }
  });

  const ref = component as unknown as PhoneInputExposed;

  return {
    ref,
    onChange,
    onCountryChange,
    container,
    unmount
  };
};

testPhoneInput(setup, tools);
