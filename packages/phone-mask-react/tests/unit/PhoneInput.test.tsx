/// <reference types="vitest/globals" />
import { createRef, type RefObject } from 'react';
import { render } from '@testing-library/react';
import { PhoneInput } from '../../src/components/PhoneInput';
import type { PhoneInputRef } from '../../src/types';
import { testPhoneInput } from '@common/tests/unit/PhoneInput';
import { tools, createResultProxy } from './setup/tools';
import type { SetupFn } from '@common/tests/unit/PhoneInput';
import type { CountryKey } from '@desource/phone-mask';

const setup: SetupFn = ({
  value = '',
  id,
  name,
  detect = false,
  showClear,
  showCopy,
  disabled,
  readonly,
  country,
  disableDefaultStyles,
  withCustomRenderers
} = {}) => {
  const onChange = vi.fn();
  const onCountryChange = vi.fn();
  const onCopy = vi.fn();
  const onFocus = vi.fn();
  const onBlur = vi.fn();
  const inputRef = createRef<PhoneInputRef>();

  const customRenderProps = withCustomRenderers
    ? {
        dropdownClass: 'custom-dropdown',
        onFocus,
        onBlur,
        renderActionsBefore: () => <span data-testid="actions-before">Before</span>,
        renderFlag: (c: { id: string }) => <span data-testid="flag-custom">{c.id}</span>,
        renderCopySvg: (copied: boolean) => <span data-testid="copy-custom">{copied ? 'copied' : 'copy'}</span>,
        renderClearSvg: () => <span data-testid="clear-custom">clear</span>
      }
    : {
        onFocus,
        onBlur
      };

  const { container, unmount } = render(
    <PhoneInput
      ref={inputRef}
      value={value}
      id={id}
      name={name}
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
      {...customRenderProps}
    />
  );

  if (!inputRef.current) throw new Error('PhoneInput ref is not created');

  return {
    ref: createResultProxy(inputRef as RefObject<PhoneInputRef>),
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
