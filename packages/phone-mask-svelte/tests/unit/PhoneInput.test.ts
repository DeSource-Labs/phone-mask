/// <reference types="vitest/globals" />
import { render } from '@testing-library/svelte';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
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

  const { container, unmount, component } = render(PhoneInput, {
    props: {
      value: options.value ?? '',
      detect: options.detect ?? false,
      showClear: options.showClear,
      showCopy: options.showCopy,
      disabled: options.disabled,
      readonly: options.readonly,
      country: options.country,
      disableDefaultStyles: options.disableDefaultStyles,
      onchange: (data) => onChange(data.digits),
      oncountrychange: onCountryChange,
      oncopy: onCopy
    }
  });

  const ref = component as unknown as PhoneInputExposed;

  return {
    ref,
    onChange,
    onCountryChange,
    onCopy,
    container,
    unmount
  };
};

testPhoneInput(setup, tools);

describe('PhoneInput (Svelte)', () => {
  it('renders custom snippets for actions, icons and flag', async () => {
    render(PhoneInputSlotsWrapper);

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
