import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  getNavigatorLang,
  getCountry,
  detectCountryFromGeoIP,
  detectCountryFromLocale,
  type MaskFull
} from '@desource/phone-mask';
import { createPhoneFormatter, setCaret } from '../utils';

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
    value: digits = '',
    onChange: onPhoneChange,
    onCountryChange
  } = options;

  const onPhoneChangeRef = useRef(onPhoneChange);
  const onCountryChangeRef = useRef(onCountryChange);

  useEffect(() => {
    onPhoneChangeRef.current = onPhoneChange;
  }, [onPhoneChange]);

  useEffect(() => {
    onCountryChangeRef.current = onCountryChange;
  }, [onCountryChange]);

  // Compute locale
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

      setCountryState((prevCountry) => {
        if (prevCountry.id === newCountry.id) return prevCountry;

        onCountryChangeRef.current?.(newCountry);

        return newCountry;
      });
    },
    [locale]
  );

  const setCountryRef = useRef(setCountry);

  useEffect(() => {
    setCountryRef.current = setCountry;
  }, [setCountry]);

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

  // Effect: Country detection (GeoIP + locale fallback)
  useEffect(() => {
    if (countryOption) return; // Skip if country is explicitly set

    if (!detect) return;

    (async () => {
      const geoCountry = await detectCountryFromGeoIP();

      if (geoCountry) {
        setCountryRef.current(geoCountry);
        return;
      }

      const localeCountry = detectCountryFromLocale();

      if (localeCountry) {
        setCountryRef.current(localeCountry);
      }
    })();
  }, [detect, countryOption]);

  // Effect: Sync country when option changes
  useEffect(() => {
    if (countryOption) {
      setCountryRef.current(countryOption);
    }
  }, [countryOption]);

  // Effect: Emit onPhoneChange
  useEffect(() => {
    onPhoneChangeRef.current?.(phoneData);
  }, [phoneData]);

  // Helper: Schedule caret position update
  const scheduleCaretUpdate = useCallback(
    (el: HTMLInputElement | null, digitIndex: number) => {
      setTimeout(() => {
        if (!el) return;
        const pos = formatter.getCaretPosition(digitIndex);
        setCaret(el, pos);
      }, 0);
    },
    [formatter]
  );

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
    setCountry,
    scheduleCaretUpdate
  };
}
