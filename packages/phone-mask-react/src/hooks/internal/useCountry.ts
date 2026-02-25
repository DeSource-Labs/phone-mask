import { useState, useEffect, useMemo, useCallback } from 'react';
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
  country?: string;
  /** Locale for country names (default: navigator.language) */
  locale?: string;
  /** Auto-detect country from IP/locale (default: false) */
  detect?: boolean;
  /** Callback when country changes */
  onCountryChange?: (country: MaskFull) => void;
}

export interface UseCountryReturn {
  /** Current country data */
  country: MaskFull;
  /** Change country programmatically */
  setCountry: (countryCode?: string | null) => boolean;
  /** Computed locale value */
  locale: string;
}

export function useCountry({
  country: countryOption,
  locale: localeOption,
  detect,
  onCountryChange
}: UseCountryOptions): UseCountryReturn {
  const locale = useMemo<string>(() => localeOption || getNavigatorLang(), [localeOption]);

  const [countryCode, setCountryCode] = useState<string>(parseCountryCode(countryOption, 'US'));

  const country = useMemo<MaskFull>(() => getCountry(countryCode, locale), [countryCode, locale]);

  const shouldDetect = !!detect && !countryOption;

  const setCountry = useCallback((countryCode?: string | null) => {
    const code = parseCountryCode(countryCode);

    if (code) {
      setCountryCode(code);
      return true;
    }

    return false;
  }, []);

  const detectCountry = useCallback(async () => {
    const geoCountry = await detectByGeoIp();

    if (setCountry(geoCountry)) return;

    const localeCountry = detectCountryFromLocale();

    setCountry(localeCountry);
  }, [setCountry]);

  useEffect(() => {
    if (countryOption && countryOption !== countryCode) {
      setCountry(countryOption);
    }
  }, [countryCode, countryOption, setCountry]);

  // Effect: Country detection
  useEffect(() => {
    if (shouldDetect) {
      detectCountry();
    }
  }, [shouldDetect, detectCountry]);

  // Effect: Emit onCountryChange
  useEffect(() => {
    onCountryChange?.(country);
  }, [country, onCountryChange]);

  return { country, setCountry, locale };
}
