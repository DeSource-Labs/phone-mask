import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getNavigatorLang,
  getCountry,
  detectCountryFromGeoIP,
  detectCountryFromLocale,
  type MaskFull
} from '@desource/phone-mask';
import { createPhoneFormatter } from '../utils';

import type { UsePhoneMaskOptions, UsePhoneMaskCoreReturn, PhoneNumber } from '../types';

/**
 * Core phone mask hook - pure state management and derived computations.
 * Can be reused by both usePhoneMask and PhoneInput.
 */
export function usePhoneMaskCore(options: UsePhoneMaskOptions = {}): UsePhoneMaskCoreReturn {
  // Destructure options for better dependency tracking
  const { locale: localeOption, country: countryOption, detect, onChange, onCountryChange } = options;

  // Compute locale
  const locale = useMemo(() => localeOption || getNavigatorLang(), [localeOption]);

  // Initialize state
  const [digits, setDigits] = useState<string>('');
  const [country, setCountryState] = useState<MaskFull>(() => getCountry(countryOption || 'US', locale));

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

  // Effect: Clamp digits when formatter changes
  useEffect(() => {
    const maxDigits = formatter.getMaxDigits();

    if (digits.length > maxDigits) {
      setDigits(digits.slice(0, maxDigits));
    }
  }, [formatter, digits]);

  // Compute derived values
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
  }, [detect, setCountry]);

  // Effect: Sync country when option changes
  useEffect(() => {
    if (countryOption) {
      setCountry(countryOption);
    }
  }, [countryOption, setCountry]);

  // Effect: Emit onCountryChange
  useEffect(() => {
    onCountryChange?.(country);
  }, [country, onCountryChange]);

  // Effect: Emit onChange
  useEffect(() => {
    onChange?.(phoneData);
  }, [phoneData, onChange]);

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
    setDigits,
    setCountry
  };
}
