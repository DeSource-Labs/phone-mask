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

describe('useCountry pending detection', () => {
  it.each(['manual selection', 'explicit country', 'detection disabled', 'destroyed'] as const)(
    'ignores a stale GeoIP response after %s',
    async (change) => {
      let resolve!: (country: string) => void;
      mocks.detectByGeoIp.mockImplementation(
        () =>
          new Promise<string>((done) => {
            resolve = done;
          })
      );
      const { result, rerender, unmount, onCountryChange } = setup({ detect: true, locale: 'en' });
      await tools.act(() => {});
      expect(mocks.detectByGeoIp).toHaveBeenCalledOnce();
      if (change === 'manual selection') result.setCountry('GB');
      if (change === 'explicit country') rerender({ countryOption: 'GB' });
      if (change === 'detection disabled') rerender({ detect: false });
      if (change === 'destroyed') unmount();
      await tools.act(() => {});
      onCountryChange.mockClear();
      await tools.act(() => resolve('DE'));
      expect(onCountryChange).not.toHaveBeenCalled();
      if (change !== 'destroyed') {
        expect(result.country.value.id).toBe(change === 'detection disabled' ? 'US' : 'GB');
        unmount();
      }
    }
  );
});
