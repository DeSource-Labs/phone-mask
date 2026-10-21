import { useState, useEffect, useMemo, useCallback, useSyncExternalStore, useRef } from 'react';
import type { MaskFull } from '@desource/phone-mask';
import {
  getNavigatorLang,
  getCountry,
  parseCountryCode,
  detectByGeoIp,
  detectCountryFromLocale
} from '@desource/phone-mask/kit';

const subscribeLocale = () => () => {};

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
  const locale = useSyncExternalStore(
    subscribeLocale,
    () => localeOption || getNavigatorLang(),
    () => localeOption || 'en'
  );

  const [countryCode, setCountryCode] = useState<string>(parseCountryCode(countryOption, 'US'));

  const country = useMemo<MaskFull>(() => getCountry(countryCode, locale), [countryCode, locale]);

  const shouldDetect = !!detect && !countryOption;
  const countryRevision = useRef(0);

  const setCountry = useCallback((countryCode?: string | null) => {
    const code = parseCountryCode(countryCode);

    if (code) {
      countryRevision.current++;
      setCountryCode(code);
      return true;
    }

    return false;
  }, []);

  const detectCountry = useCallback(async () => {
    const revision = countryRevision.current;
    const geoCountry = await detectByGeoIp();
    if (revision !== countryRevision.current) return;

    if (setCountry(geoCountry)) return;

    const localeCountry = detectCountryFromLocale();

    setCountry(localeCountry);
  }, [setCountry]);

  useEffect(() => {
    setCountry(countryOption);
  }, [countryOption, setCountry]);

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
