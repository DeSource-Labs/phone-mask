import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  getNavigatorLang,
  getCountry,
  detectCountryFromGeoIP,
  detectCountryFromLocale,
  type MaskFull
} from '@desource/phone-mask';
import { createPhoneFormatter } from '../utils';

import type { UsePhoneMaskCoreOptions, UsePhoneMaskCoreReturn, PhoneNumber } from '../types';

/**
 * Core phone mask hook - pure state management and derived computations.
 * Can be reused by both usePhoneMask and PhoneInput.
 * Works in controlled mode only - requires value prop.
 */
export function usePhoneMaskCore(options: UsePhoneMaskCoreOptions = {}): UsePhoneMaskCoreReturn {
  // Destructure options for better dependency tracking
  const {
    locale: localeOption,
    country: countryOption,
    detect,
    value = '',
    onChange,
    onPhoneChange,
    onCountryChange
  } = options;

  // Use controlled value
  const digits = value;

  // Compute locale
  const locale = useMemo(() => localeOption || getNavigatorLang(), [localeOption]);

  // Initialize country state
  const [country, setCountryState] = useState<MaskFull>(() => getCountry(countryOption || 'US', locale));

  // Store callbacks in refs to avoid recreating effects
  const onChangeRef = useRef(onChange);
  const onPhoneChangeRef = useRef(onPhoneChange);
  const onCountryChangeRef = useRef(onCountryChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onPhoneChangeRef.current = onPhoneChange;
  }, [onPhoneChange]);

  useEffect(() => {
    onCountryChangeRef.current = onCountryChange;
  }, [onCountryChange]);

  // State setter: setCountry if it changes from previous
  const setCountry = useCallback(
    (countryCode: string) => {
      const newCountry = getCountry(countryCode, locale);
      setCountryState((prevCountry) => (prevCountry.id !== newCountry.id ? newCountry : prevCountry));
    },
    [locale]
  );

  // Create formatter
  const formatter = useMemo(() => createPhoneFormatter(country), [country]);

  // Compute derived values
  const displayValue = formatter.formatDisplay(digits);
  const full = `${country.code}${digits}`;
  const fullFormatted = digits ? `${country.code} ${displayValue}` : '';
  const isComplete = formatter.isComplete(digits);
  const isEmpty = digits.length === 0;
  const shouldShowWarn = !isEmpty && !isComplete;

  // Memoize phoneData to prevent infinite loops in useEffect
  const phoneData = useMemo<PhoneNumber>(() => ({ full, fullFormatted, digits }), [full, fullFormatted, digits]);

  // Effect: Country detection (GeoIP + locale fallback) - only on mount
  useEffect(() => {
    if (!detect) return;

    (async () => {
      const geoCountry = await detectCountryFromGeoIP();

      if (geoCountry) {
        setCountry(geoCountry);
        return;
      }

      const localeCountry = detectCountryFromLocale();

      if (localeCountry) {
        setCountry(localeCountry);
      }
    })();
  }, [detect]); // Only run when detect changes, not setCountry

  // Effect: Emit onChange with digits (stable reference via ref)
  useEffect(() => {
    onChangeRef.current?.(digits);
  }, [digits]);

  // Effect: Sync country when option changes
  useEffect(() => {
    if (countryOption) {
      setCountry(countryOption);
    }
  }, [countryOption, setCountry]);

  // Effect: Emit onCountryChange (stable reference via ref)
  useEffect(() => {
    onCountryChangeRef.current?.(country);
  }, [country]);

  // Effect: Emit onPhoneChange (stable reference via ref)
  useEffect(() => {
    onPhoneChangeRef.current?.(phoneData);
  }, [phoneData]);

  return {
    digits,
    country,
    locale,
    formatter,
    displayValue,
    full,
    fullFormatted,
    isComplete,
    isEmpty,
    shouldShowWarn,
    setCountry
  };
}
