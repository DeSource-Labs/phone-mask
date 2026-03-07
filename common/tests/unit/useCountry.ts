/// <reference types="vitest/globals" />
import type { Mock } from 'vitest';

import type { MaybeRef, TestTools } from './setup/tools';

interface CountryData {
  id: string;
}

export interface CountrySetupOptions {
  countryOption?: string;
  locale?: string;
  detect?: boolean;
}

export interface CountrySetupResult {
  result: {
    country: MaybeRef<CountryData>;
    setCountry: (code?: string | null) => boolean | void;
    locale: MaybeRef<string>;
  };
  unmount: () => void;
  rerender: (props: Partial<CountrySetupOptions>) => void;
  onCountryChange: Mock;
}

export type SetupFn = (options?: CountrySetupOptions) => CountrySetupResult;

export interface CountryMocks {
  detectByGeoIp: Mock;
  detectCountryFromLocale: Mock;
}

export function testUseCountry(setup: SetupFn, { act, toValue }: TestTools, mocks: CountryMocks): void {
  beforeEach(() => {
    mocks.detectByGeoIp.mockResolvedValue(null);
    mocks.detectCountryFromLocale.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useCountry', () => {
    describe('initial state', () => {
      it('country defaults to US when no countryOption is given', () => {
        const { result, unmount } = setup({ locale: 'en' });
        expect(toValue(result.country).id).toBe('US');
        unmount();
      });

      it('country is initialized from countryOption', () => {
        const { result, unmount } = setup({ countryOption: 'DE', locale: 'en' });
        expect(toValue(result.country).id).toBe('DE');
        unmount();
      });

      it('locale reflects the provided localeOption', () => {
        const { result, unmount } = setup({ locale: 'fr' });
        expect(toValue(result.locale)).toBe('fr');
        unmount();
      });
    });

    describe('setCountry', () => {
      it('updates country for a valid code', async () => {
        const { result, unmount } = setup({ locale: 'en' });

        await act(async () => {
          result.setCountry('GB');
        });

        expect(toValue(result.country).id).toBe('GB');
        unmount();
      });

      it('returns true for a valid country code', async () => {
        const { result, unmount } = setup({ locale: 'en' });

        await act(async () => {
          expect(result.setCountry('FR')).toBe(true);
        });

        unmount();
      });

      it('returns false for an invalid country code', async () => {
        const { result, unmount } = setup({ locale: 'en' });

        await act(async () => {
          expect(result.setCountry('INVALID')).toBe(false);
        });

        unmount();
      });

      it('does not change country for an invalid code', async () => {
        const { result, unmount } = setup({ locale: 'en' });

        await act(async () => {
          result.setCountry('INVALID');
        });

        expect(toValue(result.country).id).toBe('US');
        unmount();
      });

      it('does not change country when called with null', async () => {
        const { result, unmount } = setup({ countryOption: 'DE', locale: 'en' });

        await act(async () => {
          result.setCountry(null);
        });

        expect(toValue(result.country).id).toBe('DE');
        unmount();
      });
    });

    describe('countryOption reactivity', () => {
      it('updates country when countryOption prop changes', async () => {
        const { result, rerender, unmount } = setup({ countryOption: 'US', locale: 'en' });

        await act(async () => {
          rerender({ countryOption: 'JP' });
        });

        expect(toValue(result.country).id).toBe('JP');
        unmount();
      });

      it('does not update country when countryOption changes to an invalid code', async () => {
        const { result, rerender, unmount } = setup({ countryOption: 'US', locale: 'en' });

        await act(async () => {
          rerender({ countryOption: 'INVALID' });
        });

        expect(toValue(result.country).id).toBe('US');
        unmount();
      });
    });

    describe('onCountryChange', () => {
      it('is called on initial mount with the initial country', () => {
        const { onCountryChange, unmount } = setup({ locale: 'en' });
        expect(onCountryChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'US' }));
        unmount();
      });

      it('is called when setCountry updates the country', async () => {
        const { result, onCountryChange, unmount } = setup({ locale: 'en' });
        onCountryChange.mockClear();

        await act(async () => {
          result.setCountry('DE');
        });

        expect(onCountryChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'DE' }));
        unmount();
      });

      it('is called when countryOption prop changes', async () => {
        const { rerender, onCountryChange, unmount } = setup({ countryOption: 'US', locale: 'en' });
        onCountryChange.mockClear();

        await act(async () => {
          rerender({ countryOption: 'FR' });
        });

        expect(onCountryChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'FR' }));
        unmount();
      });
    });

    describe('detect', () => {
      it('calls detectByGeoIp when detect=true and no countryOption', async () => {
        const { unmount } = setup({ detect: true, locale: 'en' });

        await act(async () => {});

        expect(mocks.detectByGeoIp).toHaveBeenCalledOnce();
        unmount();
      });

      it('does not call detectByGeoIp when detect=false', async () => {
        const { unmount } = setup({ detect: false, locale: 'en' });

        await act(async () => {});

        expect(mocks.detectByGeoIp).not.toHaveBeenCalled();
        unmount();
      });

      it('does not call detectByGeoIp when countryOption is provided', async () => {
        const { unmount } = setup({ detect: true, countryOption: 'US', locale: 'en' });

        await act(async () => {});

        expect(mocks.detectByGeoIp).not.toHaveBeenCalled();
        unmount();
      });

      it('sets country from GeoIP when it returns a valid code', async () => {
        mocks.detectByGeoIp.mockResolvedValue('JP');

        const { result, unmount } = setup({ detect: true, locale: 'en' });

        await act(async () => {});

        expect(toValue(result.country).id).toBe('JP');
        unmount();
      });

      it('falls back to detectCountryFromLocale when GeoIP returns null', async () => {
        mocks.detectByGeoIp.mockResolvedValue(null);
        mocks.detectCountryFromLocale.mockReturnValue('KR');

        const { result, unmount } = setup({ detect: true, locale: 'en' });

        await act(async () => {});

        expect(toValue(result.country).id).toBe('KR');
        unmount();
      });

      it('does not call detectCountryFromLocale when GeoIP returns a valid country', async () => {
        mocks.detectByGeoIp.mockResolvedValue('JP');

        const { unmount } = setup({ detect: true, locale: 'en' });

        await act(async () => {});

        expect(mocks.detectCountryFromLocale).not.toHaveBeenCalled();
        unmount();
      });

      it('falls back to detectCountryFromLocale when GeoIP returns an invalid country code', async () => {
        mocks.detectByGeoIp.mockResolvedValue('INVALID');
        mocks.detectCountryFromLocale.mockReturnValue('KR');

        const { result, unmount } = setup({ detect: true, locale: 'en' });

        await act(async () => {});

        expect(mocks.detectCountryFromLocale).toHaveBeenCalled();
        expect(toValue(result.country).id).toBe('KR');
        unmount();
      });
    });

    describe('locale', () => {
      it('uses navigator.language when no locale option is provided', () => {
        const { result, unmount } = setup({});
        expect(toValue(result.locale)).toBe(navigator.language);
        unmount();
      });
    });
  });
}
