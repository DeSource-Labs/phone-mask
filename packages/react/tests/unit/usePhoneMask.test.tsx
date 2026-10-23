/// <reference types="vitest/globals" />
import { useState } from 'react';
import { fireEvent, render } from '@testing-library/react';
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
      getCountry: () => getApi().country.id,
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

it('preserves public methods and native listeners across unrelated renders', () => {
  let api!: ReturnType<typeof usePhoneMask>;
  const onChange = vi.fn();
  function Harness({ onChange }: { onChange: (digits: string) => void }) {
    api = usePhoneMask({ value: '', detect: false, locale: 'en', onChange });
    return <input ref={api.ref} />;
  }
  const { container, rerender, unmount } = render(<Harness onChange={onChange} />);
  const { ref, clear, setCountry } = api;
  const input = container.querySelector('input')!;
  const addListener = vi.spyOn(input, 'addEventListener');
  const removeListener = vi.spyOn(input, 'removeEventListener');
  try {
    rerender(<Harness onChange={onChange} />);
    expect(api.ref).toBe(ref);
    expect(api.clear).toBe(clear);
    expect(api.setCountry).toBe(setCountry);
    expect(addListener).not.toHaveBeenCalled();
    expect(removeListener).not.toHaveBeenCalled();

    const nextOnChange = vi.fn();
    rerender(<Harness onChange={nextOnChange} />);
    expect(addListener).toHaveBeenCalledTimes(4);
    expect(removeListener).toHaveBeenCalledTimes(4);
    fireEvent.input(input, { target: { value: '2025550199' } });
    expect(nextOnChange).toHaveBeenCalledWith('2025550199');
    api.clear();
    expect(nextOnChange).toHaveBeenLastCalledWith('');
    expect(onChange).not.toHaveBeenCalled();
  } finally {
    unmount();
    vi.restoreAllMocks();
  }
});
