/// <reference types="vitest/globals" />
import type { Mock } from 'vitest';
import { detectByGeoIp, detectCountryFromLocale } from '@desource/phone-mask';
import { useCountry } from '../../src/composables/internal/useCountry.svelte';
import { testUseCountry, type CountrySetupOptions } from '@common/tests/unit/useCountry';
import { tools, withSetup, createState } from './setup/tools.svelte';

vi.mock('@desource/phone-mask', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@desource/phone-mask')>();
  return {
    ...actual,
    detectByGeoIp: vi.fn(),
    detectCountryFromLocale: vi.fn()
  };
});

function setup(options: CountrySetupOptions = {}) {
  const { countryOption: initialCountryOption, locale: initialLocale, detect: initialDetect = false } = options;

  const onCountryChange = vi.fn();

  const countryState = createState<string | undefined>(initialCountryOption);
  const localeState = createState<string | undefined>(initialLocale);
  const detectState = createState<boolean | undefined>(initialDetect);

  const { result, unmount } = withSetup(() =>
    useCountry({
      country: () => countryState.value,
      locale: () => localeState.value,
      detect: () => detectState.value,
      onCountryChange
    })
  );

  return {
    result,
    unmount,
    rerender: (newProps: Partial<CountrySetupOptions>) => {
      if ('countryOption' in newProps) countryState.value = newProps.countryOption;
      if ('locale' in newProps) localeState.value = newProps.locale;
      if ('detect' in newProps) detectState.value = newProps.detect;
    },
    onCountryChange
  };
}

const mocks = {
  detectByGeoIp: detectByGeoIp as unknown as Mock,
  detectCountryFromLocale: detectCountryFromLocale as unknown as Mock
};

testUseCountry(setup, tools, mocks);
