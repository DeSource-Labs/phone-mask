/// <reference types="vitest/globals" />
import { signal } from '@angular/core';
import type { Mock } from 'vitest';
import { detectByGeoIp, detectCountryFromLocale } from '@desource/phone-mask/kit';
import { useCountry } from '@src/services/internal/useCountry.service';
import { testUseCountry, type CountrySetupOptions } from '@common/tests/unit/useCountry';
import { tools, withSetup } from './setup/tools';

vi.mock('@desource/phone-mask/kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@desource/phone-mask/kit')>();
  return {
    ...actual,
    detectByGeoIp: vi.fn(),
    detectCountryFromLocale: vi.fn()
  };
});

function setup(options: CountrySetupOptions = {}) {
  const { countryOption: initialCountryOption, locale: initialLocale, detect: initialDetect = false } = options;

  const onCountryChange = vi.fn();

  const countryRef = signal<string | undefined>(initialCountryOption);
  const localeRef = signal<string | undefined>(initialLocale);
  const detectRef = signal<boolean | undefined>(initialDetect);

  const { result, unmount } = withSetup(() =>
    useCountry({
      country: countryRef,
      locale: localeRef,
      detect: detectRef,
      onCountryChange
    })
  );

  return {
    result,
    unmount,
    rerender: (newProps: Partial<CountrySetupOptions>) => {
      if ('countryOption' in newProps) countryRef.set(newProps.countryOption);
      if ('locale' in newProps) localeRef.set(newProps.locale);
      if ('detect' in newProps) detectRef.set(newProps.detect);
    },
    onCountryChange
  };
}

const mocks = {
  detectByGeoIp: detectByGeoIp as unknown as Mock,
  detectCountryFromLocale: detectCountryFromLocale as unknown as Mock
};

testUseCountry(setup, tools, mocks);
