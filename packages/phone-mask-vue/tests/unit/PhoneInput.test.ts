/// <reference types="vitest/globals" />
import { defineComponent, shallowRef, h } from 'vue';
import { render } from '@testing-library/vue';
import { PhoneInput } from '../../src/index';
import type { PhoneInputExposed } from '../../src/types';
import { testPhoneInput } from '@common/tests/unit/PhoneInput';
import { tools } from './setup/tools';
import type { SetupFn } from '@common/tests/unit/PhoneInput';
import type { CountryKey } from '@desource/phone-mask';

const setup: SetupFn = async (options = {}) => {
  const onChange = vi.fn();
  const onCountryChange = vi.fn();
  const onCopy = vi.fn();
  const onFocus = vi.fn();
  const onBlur = vi.fn();
  const phoneRef = shallowRef<PhoneInputExposed | null>(null);

  const slots = options.withCustomRenderers
    ? {
        'actions-before': () => h('span', { 'data-testid': 'actions-before' }, 'Before'),
        'copy-svg': () => h('span', { 'data-testid': 'copy-custom' }, 'Copy'),
        'clear-svg': () => h('span', { 'data-testid': 'clear-custom' }, 'Clear'),
        flag: ({ country }: { country: { id: string } }) => h('span', { 'data-testid': 'flag-custom' }, country.id)
      }
    : undefined;

  const Wrapper = defineComponent({
    render: () =>
      h(PhoneInput, {
        ref: phoneRef,
        modelValue: options.value ?? '',
        'onUpdate:modelValue': onChange,
        'onCountry-change': onCountryChange,
        onCopy,
        onFocus,
        onBlur,
        detect: options.detect as boolean,
        showClear: options.showClear as boolean,
        showCopy: options.showCopy as boolean,
        disabled: options.disabled as boolean,
        readonly: options.readonly as boolean,
        country: options.country as CountryKey | undefined,
        disableDefaultStyles: options.disableDefaultStyles,
        dropdownClass: options.withCustomRenderers ? 'custom-dropdown' : undefined
      }, slots)
  });

  const { container, unmount } = render(Wrapper);

  if (!phoneRef.value) throw new Error('PhoneInput ref is not created');

  return {
    ref: phoneRef.value,
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
