/// <reference types="vitest/globals" />
import type { Mock } from 'vitest';
import { detectByGeoIp, detectCountryFromLocale } from '@desource/phone-mask';
import { useCountry } from '@src/hooks/internal/useCountry';
import { testUseCountry, type CountrySetupOptions } from '@common/tests/unit/useCountry';
import { tools, renderHookWithProxy } from './setup/tools';

vi.mock('@desource/phone-mask', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@desource/phone-mask')>();
  return {
    ...actual,
    detectByGeoIp: vi.fn(),
    detectCountryFromLocale: vi.fn()
  };
});

function setup(options: CountrySetupOptions = {}) {
  const { countryOption: initialCountryOption, locale, detect = false } = options;

  const onCountryChange = vi.fn();

  let currentProps: CountrySetupOptions = { countryOption: initialCountryOption, locale, detect };

  const { result, unmount, rerender } = renderHookWithProxy(
    ({ countryOption, locale, detect }: CountrySetupOptions) =>
      useCountry({ country: countryOption, locale, detect, onCountryChange }),
    { initialProps: currentProps }
  );

  return {
    result,
    unmount,
    rerender: (newProps: Partial<CountrySetupOptions>) => {
      currentProps = { ...currentProps, ...newProps };
      rerender(currentProps);
    },
    onCountryChange
  };
}

const mocks = {
  detectByGeoIp: detectByGeoIp as unknown as Mock,
  detectCountryFromLocale: detectCountryFromLocale as unknown as Mock
};

testUseCountry(setup, tools, mocks);
