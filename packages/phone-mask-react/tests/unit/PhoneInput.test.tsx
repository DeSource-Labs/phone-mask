/// <reference types="vitest/globals" />
import { createRef, type RefObject } from 'react';
import { render } from '@testing-library/react';
import { PhoneInput } from '../../src/components/PhoneInput';
import type { PhoneInputRef } from '../../src/types';
import { testPhoneInput } from '@common/tests/unit/PhoneInput';
import { tools, createResultProxy } from './setup/tools';
import type { SetupFn } from '@common/tests/unit/PhoneInput';

const setup: SetupFn = ({ value = '', detect = false, showClear } = {}) => {
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
