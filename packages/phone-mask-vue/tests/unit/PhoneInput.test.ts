/// <reference types="vitest/globals" />
import { defineComponent, shallowRef, h } from 'vue';
import { render, fireEvent, screen, waitFor } from '@testing-library/vue';
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
  const phoneRef = shallowRef<PhoneInputExposed | null>(null);

  const Wrapper = defineComponent({
    render: () =>
      h(PhoneInput, {
        ref: phoneRef,
        modelValue: options.value ?? '',
        'onUpdate:modelValue': onChange,
        'onCountry-change': onCountryChange,
        onCopy,
        detect: options.detect,
        showClear: options.showClear,
        showCopy: options.showCopy,
        disabled: options.disabled,
        readonly: options.readonly,
        country: options.country as CountryKey | undefined,
        disableDefaultStyles: options.disableDefaultStyles
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

describe('PhoneInput (Vue)', () => {
  it('renders custom slots for actions, icons and flag', async () => {
    render(PhoneInput, {
      props: {
        modelValue: '2025550199',
        detect: false,
        showClear: true
      },
      slots: {
        'actions-before': '<span data-testid="actions-before">Before</span>',
        'copy-svg': '<span data-testid="copy-slot">Copy</span>',
        'clear-svg': '<span data-testid="clear-slot">Clear</span>',
        flag: '<span data-testid="flag-slot">Flag</span>'
      }
    });

    expect(screen.queryByTestId('actions-before')).not.toBeNull();
    expect(screen.queryByTestId('copy-slot')).not.toBeNull();
    expect(screen.queryByTestId('clear-slot')).not.toBeNull();
    expect(screen.queryByTestId('flag-slot')).not.toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: /selected country/i }));
    await waitFor(() => {
      expect(document.body.querySelector('.phone-dropdown')).not.toBeNull();
    });

    expect(document.body.querySelectorAll('[data-testid="flag-slot"]').length).toBeGreaterThan(0);
  });
});
