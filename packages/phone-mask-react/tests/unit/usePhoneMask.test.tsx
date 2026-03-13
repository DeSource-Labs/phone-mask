/// <reference types="vitest/globals" />
import { useState } from 'react';
import { render } from '@testing-library/react';
import { usePhoneMask } from '../../src/hooks/usePhoneMask';
import { testUsePhoneMask, type UsePhoneMaskSetupOptions } from '@common/tests/unit/usePhoneMask';
import { tools } from './setup/tools';

function setup(initialValue = '', options: UsePhoneMaskSetupOptions = {}) {
  const { attachRef = true } = options;
  const onChange = vi.fn();
  let currentValue = initialValue;
  let api: ReturnType<typeof usePhoneMask> | null = null;

  function Harness() {
    const [value, setValue] = useState(initialValue);
    currentValue = value;

    api = usePhoneMask({
      value,
      detect: false,
      onChange: (nextDigits) => {
        onChange(nextDigits);
        setValue(nextDigits);
      }
    });

    return <input data-testid="phone-input" ref={attachRef ? api.ref : undefined} />;
  }

  const rendered = render(<Harness />);
  const inputEl = rendered.getByTestId('phone-input') as HTMLInputElement;

  const getApi = () => {
    if (!api) throw new Error('usePhoneMask api is not ready');
    return api;
  };

  return {
    inputEl,
    onChange,
    getValue: () => currentValue,
    unmount: rendered.unmount,
    api: {
      getDigits: () => getApi().digits,
      getFull: () => getApi().full,
      getFullFormatted: () => getApi().fullFormatted,
      isEmpty: () => getApi().isEmpty,
      shouldShowWarn: () => getApi().shouldShowWarn,
      setCountry: (countryCode: string) => getApi().setCountry(countryCode),
      clear: () => getApi().clear()
    }
  };
}

testUsePhoneMask(setup, tools);
