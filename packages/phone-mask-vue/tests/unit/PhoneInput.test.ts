/// <reference types="vitest/globals" />
import { defineComponent, shallowRef, h } from 'vue';
import { render } from '@testing-library/vue';
import { PhoneInput } from '../../src/index';
import type { PhoneInputExposed } from '../../src/types';
import { testPhoneInput } from '@common/tests/unit/PhoneInput';
import { tools } from './setup/tools';
import type { SetupFn } from '@common/tests/unit/PhoneInput';

const setup: SetupFn = async (options = {}) => {
  const onChange = vi.fn();
  const onCountryChange = vi.fn();
  const onCopy = vi.fn();
  const phoneRef = shallowRef<PhoneInputExposed | null>(null);

  const Wrapper = defineComponent({
    render: () =>
      h(PhoneInput, {
        ref: phoneRef,
        modelValue: options.value ?? '',
        'onUpdate:modelValue': onChange,
        'onCountry-change': onCountryChange,
        onCopy,
        detect: options.detect ?? false,
        showClear: options.showClear
      })
  });

  const { container, unmount } = render(Wrapper);

  if (!phoneRef.value) throw new Error('PhoneInput ref is not created');

  return {
    ref: phoneRef.value,
    onChange,
    onCountryChange,
    onCopy,
    container,
    unmount
  };
};

testPhoneInput(setup, tools);
