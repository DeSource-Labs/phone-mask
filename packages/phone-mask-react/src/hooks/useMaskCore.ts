import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  extractDigits,
  getNavigatorLang,
  getCountry,
  hasCountry,
  detectByGeoIp,
  detectCountryFromLocale,
  createPhoneFormatter,
  type MaskFull,
  type FormatterHelpers
} from '@desource/phone-mask';

import type { PhoneNumber } from '../types';

/** Configuration options for the phone mask core hook */
export interface UseMaskCoreOptions {
  /**
   * Controlled value (digits only, without country code)
   * The parent is responsible for managing state via onChange callback.
   */
  value: string;
  /** Callback when the digits value changes. */
  onChange: (digits: string) => void;
  /** Country ISO code (e.g., 'US', 'DE', 'GB') */
  country?: string;
  /** Locale for country names (default: navigator.language) */
  locale?: string;
  /** Auto-detect country from IP/locale (default: false) */
  detect?: boolean;
  /** Callback when the phone number changes. */
  onPhoneChange?: (value: PhoneNumber) => void;
  /** Callback when country changes */
  onCountryChange?: (country: MaskFull) => void;
}

/** Return type for useMaskCore hook */
export interface UseMaskCoreReturn {
  /** Current country data */
  country: MaskFull;
  /** Change country programmatically */
  setCountry: (countryCode: string) => void;
  /** Raw digits without formatting */
  digits: string;
  /** Computed locale value */
  locale: string;
  /** Phone formatter instance */
  formatter: FormatterHelpers;
  /** Placeholder from formatter */
  displayPlaceholder: string;
  /** Formatted display string */
  displayValue: string;
  /** Full phone number with country code */
  full: string;
  /** Full phone number formatted */
  fullFormatted: string;
  /** Whether the phone number is complete */
  isComplete: boolean;
  /** Whether the input is empty */
  isEmpty: boolean;
  /** Whether to show validation warning */
  shouldShowWarn: boolean;
}

/**
 * Core phone mask hook - pure state management and derived computations.
 * Can be reused by both usePhoneMask and PhoneInput.
 * Works in controlled mode only - requires value prop.
 */
export function useMaskCore(options: UseMaskCoreOptions): UseMaskCoreReturn {
  // Destructure options for better dependency tracking
  const {
    locale: localeOption,
    country: countryOption,
    detect,
    value,
    onChange,
    onPhoneChange,
    onCountryChange
  } = options;

  const locale = useMemo(() => localeOption || getNavigatorLang(), [localeOption]);

  // Initialize country state
  const [country, setCountryState] = useState<MaskFull>(() => getCountry(countryOption || 'US', locale));

  // Effect: Refresh country when locale changes (keep same country id, update localized fields)
  useEffect(() => {
    setCountryState((prevCountry: MaskFull) => getCountry(prevCountry.id, locale));
  }, [locale]);

  // State setter: setCountry if it changes from previous
  const setCountry = useCallback(
    (countryCode: string) => {
      const newCountry = getCountry(countryCode, locale);

      setCountryState((prevCountry: MaskFull) => {
        if (prevCountry.id === newCountry.id) return prevCountry;
        return newCountry;
      });
    },
    [locale]
  );

  const formatter = useMemo(() => createPhoneFormatter(country), [country]);
  const maxDigits = formatter.getMaxDigits();
  const digits = useMemo(() => extractDigits(value, maxDigits), [value, maxDigits]);

  // Compute derived values
  const displayPlaceholder = formatter.getPlaceholder();
  const displayValue = formatter.formatDisplay(digits);
  const full = `${country.code}${digits}`;
  const fullFormatted = digits ? `${country.code} ${displayValue}` : '';
  const isComplete = formatter.isComplete(digits);
  const isEmpty = digits.length === 0;
  const shouldShowWarn = !isEmpty && !isComplete;

  // Memoize phoneData to prevent infinite loops in useEffect
  const phoneData = useMemo<PhoneNumber>(() => ({ full, fullFormatted, digits }), [full, fullFormatted, digits]);

  // Effect: Country detection (GeoIP + locale fallback)
  useEffect(() => {
    if (countryOption && hasCountry(countryOption)) {
      setCountry(countryOption);
      return;
    }

    if (!detect) return;

    (async () => {
      const geoCountry = await detectByGeoIp(hasCountry);

      if (geoCountry) {
        setCountry(geoCountry);
        return;
      }

      const localeCountry = detectCountryFromLocale();

      if (localeCountry && hasCountry(localeCountry)) {
        setCountry(localeCountry);
      }
    })();
  }, [detect, countryOption, setCountry]);

  // Clamp digits formatter changes
  useEffect(() => {
    if (value !== digits) {
      onChange?.(digits);
    }
  }, [value, digits, onChange]);

  // Effect: Emit onCountryChange
  useEffect(() => {
    onCountryChange?.(country);
  }, [country, onCountryChange]);

  // Effect: Emit onPhoneChange
  useEffect(() => {
    onPhoneChange?.(phoneData);
  }, [phoneData, onPhoneChange]);

  return {
    digits,
    country,
    locale,
    formatter,
    displayPlaceholder,
    displayValue,
    full,
    fullFormatted,
    isComplete,
    isEmpty,
    shouldShowWarn,
    setCountry
  };
}
