/// <reference types="vitest/globals" />
import { createRef, type RefObject } from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { PhoneInput } from '../../src/components/PhoneInput';
import type { PhoneInputRef } from '../../src/types';
import { testPhoneInput } from '@common/tests/unit/PhoneInput';
import { tools, createResultProxy } from './setup/tools';
import type { SetupFn } from '@common/tests/unit/PhoneInput';
import type { CountryKey } from '@desource/phone-mask';

const setup: SetupFn = ({ value = '', detect = false, showClear, showCopy, disabled, readonly, country, disableDefaultStyles } = {}) => {
  const onChange = vi.fn();
  const onCountryChange = vi.fn();
  const onCopy = vi.fn();
  const inputRef = createRef<PhoneInputRef>();

  const { container, unmount } = render(
    <PhoneInput
      ref={inputRef}
      value={value}
      onChange={onChange}
      onCountryChange={onCountryChange}
      onCopy={onCopy}
      detect={detect}
      showClear={showClear}
      showCopy={showCopy}
      disabled={disabled}
      readonly={readonly}
      country={country as CountryKey | undefined}
      disableDefaultStyles={disableDefaultStyles}
    />
  );

  if (!inputRef.current) throw new Error('PhoneInput ref is not created');

  return {
    ref: createResultProxy(inputRef as RefObject<PhoneInputRef>),
    onChange,
    onCountryChange,
    onCopy,
    container,
    unmount
  };
};

testPhoneInput(setup, tools);

describe('PhoneInput (React)', () => {
  it('supports custom render callbacks and focus/blur callbacks', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onChange = vi.fn();

    render(
      <PhoneInput
        value="2025550199"
        detect={false}
        showClear
        dropdownClass="custom-dropdown"
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        renderActionsBefore={() => <span data-testid="actions-before">Before</span>}
        renderFlag={(country) => <span data-testid={`flag-${country.id}`}>{country.id}</span>}
        renderCopySvg={(copied) => <span data-testid="copy-svg">{copied ? 'copied' : 'copy'}</span>}
        renderClearSvg={() => <span data-testid="clear-svg">clear</span>}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);

    expect(screen.queryByTestId('actions-before')).not.toBeNull();
    expect(screen.queryByTestId('copy-svg')).not.toBeNull();
    expect(screen.queryByTestId('clear-svg')).not.toBeNull();
    expect(screen.queryByTestId('flag-US')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /selected country/i }));

    await waitFor(() => {
      const dropdown = document.body.querySelector('.phone-dropdown.custom-dropdown');
      expect(dropdown).not.toBeNull();
    });

    expect(document.body.querySelector('[data-testid^="flag-"]')).not.toBeNull();
  });
});
