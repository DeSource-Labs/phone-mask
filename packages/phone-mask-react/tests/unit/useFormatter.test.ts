/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import { getCountry } from '@desource/phone-mask';
import { useFormatter } from '../../src/hooks/internal/useFormatter';
import { testUseFormatter, type SetupOptions } from '@common/tests/unit/useFormatter';
import { tools } from './setup/tools';

function setup(options: SetupOptions = {}) {
  const { countryCode = 'US', value: initialValue = '' } = options;

  const onChange = vi.fn();
  const onPhoneChange = vi.fn();
  const onValidationChange = vi.fn();

  const { result, unmount, rerender } = renderHook(
    ({ value, code }: { value: string; code: string }) =>
      useFormatter({
        country: getCountry(code, 'en'),
        value,
        onChange,
        onPhoneChange,
        onValidationChange
      }),
    { initialProps: { value: initialValue, code: countryCode } }
  );

  // Proxy ensures we always read the latest result.current after re-renders
  const resultProxy = new Proxy({} as ReturnType<typeof useFormatter>, {
    get(_target, key) {
      return result.current[key as keyof typeof result.current];
    }
  });

  return {
    result: resultProxy,
    unmount,
    rerender: ({ value, countryCode: code }: { value?: string; countryCode?: string }) => {
      rerender({
        value: value ?? result.current.digits,
        code: code ?? countryCode
      });
    },
    onChange,
    onPhoneChange,
    onValidationChange
  };
}

testUseFormatter(setup, tools);
