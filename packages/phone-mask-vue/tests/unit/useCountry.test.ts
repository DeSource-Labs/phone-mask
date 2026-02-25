/// <reference types="vitest/globals" />
import { ref } from 'vue';
import type { Mock } from 'vitest';
import { detectByGeoIp, detectCountryFromLocale } from '@desource/phone-mask';
import { useCountry } from '../../src/composables/internal/useCountry';
import { testUseCountry, type CountrySetupOptions } from '@common/tests/unit/useCountry';
import { tools, withSetup } from './setup/tools';

vi.mock('@desource/phone-mask', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@desource/phone-mask')>();
  return {
    ...actual,
    detectByGeoIp: vi.fn(),
    detectCountryFromLocale: vi.fn()
  };
});

function setup(options: CountrySetupOptions = {}) {
  const { countryOption: initialCountryOption, locale: initialLocale = 'en', detect: initialDetect = false } = options;

  const onCountryChange = vi.fn();

  const countryRef = ref<string | undefined>(initialCountryOption);
  const localeRef = ref<string | undefined>(initialLocale);
  const detectRef = ref<boolean | undefined>(initialDetect);

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
      if ('countryOption' in newProps) countryRef.value = newProps.countryOption;
      if ('locale' in newProps) localeRef.value = newProps.locale;
      if ('detect' in newProps) detectRef.value = newProps.detect;
    },
    onCountryChange
  };
}

const mocks = {
  detectByGeoIp: detectByGeoIp as unknown as Mock,
  detectCountryFromLocale: detectCountryFromLocale as unknown as Mock
};

testUseCountry(setup, tools, mocks);
