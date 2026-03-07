import {
  getNavigatorLang,
  getCountry,
  parseCountryCode,
  detectByGeoIp,
  detectCountryFromLocale,
  type MaskFull
} from '@desource/phone-mask';

export interface UseCountryOptions {
  /** Country ISO code (e.g., 'US', 'DE', 'GB') */
  country?: () => string | undefined;
  /** Locale for country names (default: navigator.language) */
  locale?: () => string | undefined;
  /** Auto-detect country from IP/locale (default: false) */
  detect?: () => boolean | undefined;
  /** Callback when country changes */
  onCountryChange?: (country: MaskFull) => void;
}

export function useCountry({
  country: countryOption,
  locale: localeOption,
  detect,
  onCountryChange
}: UseCountryOptions = {}) {
  let countryCode = $state<string>(parseCountryCode(countryOption?.(), 'US'));

  const locale = $derived<string>(localeOption?.() || getNavigatorLang());
  const country = $derived<MaskFull>(getCountry(countryCode, locale));

  const setCountry = (code?: string | null): boolean => {
    const parsed = parseCountryCode(code);
    if (parsed) {
      countryCode = parsed;
      return true;
    }
    return false;
  };

  const detectCountry = async () => {
    try {
      const geoCountry = await detectByGeoIp();
      if (setCountry(geoCountry)) return;
    } catch {
      // Network failure — fall through to locale detection
    }
    const localeCountry = detectCountryFromLocale();
    setCountry(localeCountry);
  };

  // Sync external country prop
  $effect(() => {
    const newCountry = countryOption?.();
    if (newCountry && newCountry !== countryCode) {
      setCountry(newCountry);
    }
  });

  // Auto-detect country
  $effect(() => {
    if (detect?.() && !countryOption?.()) {
      detectCountry();
    }
  });

  // Emit onCountryChange
  $effect(() => {
    onCountryChange?.(country);
  });

  return {
    get country() {
      return country;
    },
    get locale() {
      return locale;
    },
    setCountry
  };
}
