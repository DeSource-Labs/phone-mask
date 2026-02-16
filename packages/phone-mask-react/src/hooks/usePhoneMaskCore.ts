import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getNavigatorLang,
  getCountry,
  detectCountryFromGeoIP,
  detectCountryFromLocale,
  setCaret,
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
    value: digits = '',
    onChange: onPhoneChange,
    onCountryChange
  } = options;

  // Compute locale
  const locale = useMemo(() => localeOption || getNavigatorLang(), [localeOption]);

  // Initialize country state
  const [country, setCountryState] = useState<MaskFull>(() => getCountry(countryOption || 'US', locale));

  // State setter: setCountry if it changes from previous
  const setCountry = useCallback(
    (countryCode: string) => {
      const newCountry = getCountry(countryCode, locale);
      setCountryState((prevCountry) => {
        if (prevCountry.id === newCountry.id) return prevCountry;

        onCountryChange?.(newCountry);

        return newCountry; // Update state
      });
    },
    [locale, onCountryChange]
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
  }, [detect, setCountry]);

  // Effect: Sync country when option changes
  useEffect(() => {
    if (countryOption) {
      setCountry(countryOption);
    }
  }, [countryOption, setCountry]);

  // Effect: Emit onPhoneChange
  useEffect(() => {
    onPhoneChange?.(phoneData);
  }, [phoneData, onPhoneChange]);

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
