/// <reference types="vitest/globals" />
import { getCountry } from '@desource/phone-mask';
import { useFormatter } from '../../../src/hooks/internal/useFormatter';
import { testUseFormatter, type SetupOptions } from '@common/tests/unit/useFormatter';
import { tools, renderHookWithProxy } from '../setup/tools';

function setup(options: SetupOptions = {}) {
  const { countryCode = 'US', value: initialValue = '' } = options;

  const onChange = vi.fn();
  const onPhoneChange = vi.fn();
  const onValidationChange = vi.fn();

  const { result, unmount, rerender } = renderHookWithProxy(
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

  return {
    result,
    unmount,
    rerender: ({ value, countryCode: code }: { value?: string; countryCode?: string }) => {
      rerender({
        value: value ?? result.digits,
        code: code ?? countryCode
      });
    },
    onChange,
    onPhoneChange,
    onValidationChange
  };
}

testUseFormatter(setup, tools);
