/// <reference types="vitest/globals" />
import { render } from '@testing-library/svelte';
import PhoneInput from '@src/components/PhoneInput.svelte';
import type { PhoneInputExposed } from '@src/types';
import { testPhoneInput } from '@common/tests/unit/PhoneInput';
import { tools } from './setup/tools.svelte';
import type { SetupFn } from '@common/tests/unit/PhoneInput';
import PhoneInputSlotsWrapper from './setup/PhoneInputSlotsWrapper.svelte';

const setup: SetupFn = (options = {}) => {
  const onChange = vi.fn();
  const onCountryChange = vi.fn();
  const onCopy = vi.fn();
  const onFocus = vi.fn();
  const onBlur = vi.fn();

  const rendered = options.withCustomRenderers
    ? render(PhoneInputSlotsWrapper, {
        props: {
          initialValue: options.value ?? '2025550199',
          onfocus: onFocus,
          onblur: onBlur,
          onchange: onChange,
          oncountrychange: onCountryChange,
          oncopy: onCopy
        }
      })
    : render(PhoneInput, {
        props: {
          value: options.value ?? '',
          detect: options.detect ?? false,
          showClear: options.showClear,
          showCopy: options.showCopy,
          disabled: options.disabled,
          readonly: options.readonly,
          country: options.country,
          disableDefaultStyles: options.disableDefaultStyles,
          onfocus: onFocus,
          onblur: onBlur,
          onchange: (data) => onChange(data.digits),
          oncountrychange: onCountryChange,
          oncopy: onCopy
        }
      });

  const { container, unmount, component } = rendered;

  const ref = component as unknown as PhoneInputExposed;

  return {
    ref,
    onChange,
    onCountryChange,
    onCopy,
    onFocus,
    onBlur,
    container,
    unmount
  };
};

testPhoneInput(setup, tools);
