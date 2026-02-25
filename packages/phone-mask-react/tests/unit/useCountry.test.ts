/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';
import { detectByGeoIp, detectCountryFromLocale } from '@desource/phone-mask';
import { useCountry } from '../../src/hooks/internal/useCountry';
import { testUseCountry, type CountrySetupOptions } from '@common/tests/unit/useCountry';
import { tools } from './setup/tools';

vi.mock('@desource/phone-mask', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@desource/phone-mask')>();
  return {
    ...actual,
    detectByGeoIp: vi.fn(),
    detectCountryFromLocale: vi.fn()
  };
});

function setup(options: CountrySetupOptions = {}) {
  const { countryOption: initialCountryOption, locale = 'en', detect = false } = options;

  const onCountryChange = vi.fn();
  let currentProps: CountrySetupOptions = { countryOption: initialCountryOption, locale, detect };

  const { result, unmount, rerender } = renderHook(
    ({ countryOption, locale: loc, detect: det }: CountrySetupOptions) =>
      useCountry({ country: countryOption, locale: loc, detect: det, onCountryChange }),
    { initialProps: currentProps }
  );

  // Proxy ensures we always read the latest result.current after re-renders
  const resultProxy = new Proxy({} as ReturnType<typeof useCountry>, {
    get(_target, key) {
      return result.current[key as keyof typeof result.current];
    }
  });

  return {
    result: resultProxy,
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
