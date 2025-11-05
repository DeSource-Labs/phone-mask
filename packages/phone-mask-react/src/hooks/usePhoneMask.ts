import { useRef, useState, useEffect, useCallback } from 'react';
import { MasksFullMap, MasksFullMapEn, type CountryKey, type MaskFull } from '@desource/phone-mask';
import { createPhoneFormatter, extractDigits, getSelection, setCaret } from '../utils';
import { Delimiters, GEO_IP_TIMEOUT, GEO_IP_URL, InvalidPattern, NavigationKeys } from '../consts';
import type { UsePhoneMaskOptions, UsePhoneMaskReturn, PhoneNumber } from '../types';

/** Get browser navigator language */
function getNavigatorLang(): string {
  if (typeof navigator !== 'undefined') {
    return navigator.language || '';
  }
  return '';
}

/** Get country data by ISO code and locale */
function getCountry(countryCode: string, locale: string): MaskFull | null {
  const isEn = locale.toLowerCase().startsWith('en');
  const countriesMap = isEn ? MasksFullMapEn : MasksFullMap(locale);
  const id = countryCode.toUpperCase() as CountryKey;
  const found = countriesMap[id];
  return found ? { id, ...found } : null;
}

/** Get default country (US) for the given locale */
function getDefaultCountry(locale: string): MaskFull {
  const isEn = locale.toLowerCase().startsWith('en');
  const countries = isEn ? MasksFullMapEn : MasksFullMap(locale);
  return { id: 'US', ...countries.US };
}

/**
 * Detect country from GeoIP service.
 */
async function detectCountryFromGeoIP(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEO_IP_TIMEOUT);

    const res = await fetch(GEO_IP_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const json = await res.json();
    const code = (json.country || json.country_code || json.countryCode || json.country_code2 || '')
      .toString()
      .toUpperCase();

    return code || null;
  } catch {
    return null;
  }
}

/**
 * Detect country from browser locale.
 */
function detectCountryFromLocale(): string | null {
  try {
    const lang = getNavigatorLang();

    try {
      const loc = new Intl.Locale(lang);
      if (loc.region) return loc.region.toUpperCase();
    } catch {
      // Ignore
    }

    const parts = lang.split(/[-_]/);
    if (parts.length > 1) return parts[1]?.toUpperCase() || null;
  } catch {
    // Ignore
  }

  return null;
}

/**
 * React hook for phone number masking.
 * Provides low-level phone masking functionality for custom input implementations.
 */
export function usePhoneMask(options: UsePhoneMaskOptions = {}): UsePhoneMaskReturn {
  const inputRef = useRef<HTMLInputElement>(null);
  const [digits, setDigits] = useState<string>('');
  const [country, setCountryState] = useState<MaskFull>(() => {
    const locale = options.locale || getNavigatorLang() || 'en';
    if (options.country) {
      const c = getCountry(options.country, locale);
      if (c) return c;
    }
    return getDefaultCountry(locale);
  });

  const locale = options.locale || getNavigatorLang() || 'en';
  const formatter = createPhoneFormatter(country);

  const displayValue = formatter.formatDisplay(digits);
  const full = `${country.code}${digits}`;
  const fullFormatted = digits ? `${country.code} ${displayValue}` : '';
  const isComplete = formatter.isComplete(digits);
  const isEmpty = digits.length === 0;
  const shouldShowWarn = !isEmpty && !isComplete;

  // Initialize country detection
  useEffect(() => {
    if (!options.detect) return;

    (async () => {
      let detected: MaskFull | null = null;

      const geoCountry = await detectCountryFromGeoIP();
      if (geoCountry) {
        detected = getCountry(geoCountry, locale);
      }

      if (!detected) {
        const localeCountry = detectCountryFromLocale();
        if (localeCountry) {
          detected = getCountry(localeCountry, locale);
        }
      }

      if (detected) {
        setCountryState(detected);
        options.onCountryChange?.(detected);
      }
    })();
  }, [options.detect]);

  // Sync country when prop changes
  useEffect(() => {
    if (options.country) {
      const newCountry = getCountry(options.country, locale);
      if (newCountry && newCountry.id !== country.id) {
        setCountryState(newCountry);
        options.onCountryChange?.(newCountry);
      }
    }
  }, [options.country, locale]);

  // Update display when digits or country change
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    el.value = displayValue;
    el.placeholder = formatter.getPlaceholder();
  }, [displayValue, formatter]);

  // Notify onChange callback
  useEffect(() => {
    if (options.onChange) {
      const phoneData: PhoneNumber = {
        full,
        fullFormatted,
        digits
      };
      options.onChange(phoneData);
    }
  }, [digits, full, fullFormatted]);

  // Event handler: beforeinput
  const handleBeforeInput = useCallback(
    (e: InputEvent) => {
      const data = e.data;
      if (e.inputType !== 'insertText' || !data) return;

      const el = inputRef.current;
      if (!el) return;

      // Block invalid characters & multiple spaces
      if (InvalidPattern.test(data) || (data === ' ' && el.value.endsWith(' '))) {
        e.preventDefault();
      }
    },
    []
  );

  // Event handler: input
  const handleInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;

    const raw = el.value || '';
    const maxDigits = formatter.getMaxDigits();
    const newDigits = extractDigits(raw, maxDigits);

    setDigits(newDigits);

    // Set caret position after state update
    setTimeout(() => {
      const pos = formatter.getCaretPosition(newDigits.length);
      setCaret(el, pos);
    }, 0);
  }, [formatter]);

  // Event handler: keydown
  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      const el = inputRef.current;
      if (!el) return;

      // Allow meta & navigation keys
      if (e.ctrlKey || e.metaKey || e.altKey || NavigationKeys.includes(e.key)) return;

      const [selStart, selEnd] = getSelection(el);

      if (e.key === 'Backspace') {
        e.preventDefault();

        if (selStart !== selEnd) {
          const range = formatter.getDigitRange(digits, selStart, selEnd);
          if (range) {
            const [start, end] = range;
            const newDigits = digits.slice(0, start) + digits.slice(end);
            setDigits(newDigits);
            setTimeout(() => {
              const pos = formatter.getCaretPosition(start);
              setCaret(el, pos);
            }, 0);
          }
          return;
        }

        if (selStart > 0) {
          const displayStr = el.value;
          let prevPos = selStart - 1;
          while (prevPos >= 0 && Delimiters.includes(displayStr[prevPos]!)) {
            prevPos--;
          }

          if (prevPos >= 0) {
            const range = formatter.getDigitRange(digits, prevPos, prevPos + 1);
            if (range) {
              const [start] = range;
              const newDigits = digits.slice(0, start) + digits.slice(start + 1);
              setDigits(newDigits);
              setTimeout(() => {
                const pos = formatter.getCaretPosition(start);
                setCaret(el, pos);
              }, 0);
            }
          }
        }
        return;
      }

      if (e.key === 'Delete') {
        e.preventDefault();

        if (selStart !== selEnd) {
          const range = formatter.getDigitRange(digits, selStart, selEnd);
          if (range) {
            const [start, end] = range;
            const newDigits = digits.slice(0, start) + digits.slice(end);
            setDigits(newDigits);
            setTimeout(() => {
              const pos = formatter.getCaretPosition(start);
              setCaret(el, pos);
            }, 0);
          }
          return;
        }

        if (selStart < el.value.length) {
          const range = formatter.getDigitRange(digits, selStart, selStart + 1);
          if (range) {
            const [start] = range;
            const newDigits = digits.slice(0, start) + digits.slice(start + 1);
            setDigits(newDigits);
            setTimeout(() => {
              const pos = formatter.getCaretPosition(start);
              setCaret(el, pos);
            }, 0);
          }
        }
        return;
      }

      // Block max digits
      if (/^[0-9]$/.test(e.key)) {
        if (digits.length >= formatter.getMaxDigits()) {
          e.preventDefault();
        }
        return;
      }

      // Block non-numeric
      if (e.key.length === 1) {
        e.preventDefault();
      }
    },
    [digits, formatter]
  );

  // Event handler: paste
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      e.preventDefault();

      const el = inputRef.current;
      if (!el) return;

      const text = e.clipboardData?.getData('text') || '';
      const maxDigits = formatter.getMaxDigits();
      const pastedDigits = extractDigits(text, maxDigits);

      if (pastedDigits.length === 0) return;

      const [selStart, selEnd] = getSelection(el);

      if (selStart !== selEnd) {
        const range = formatter.getDigitRange(digits, selStart, selEnd);

        if (range) {
          const [start, end] = range;
          const left = digits.slice(0, start);
          const right = digits.slice(end);
          const newDigits = extractDigits(left + pastedDigits + right, maxDigits);
          setDigits(newDigits);
          setTimeout(() => {
            const pos = formatter.getCaretPosition(start + pastedDigits.length);
            setCaret(el, pos);
          }, 0);
          return;
        }
      }

      const range = formatter.getDigitRange(digits, selStart, selStart);
      const insertIndex = range ? range[0] : digits.length;

      const left = digits.slice(0, insertIndex);
      const right = digits.slice(insertIndex);
      const newDigits = extractDigits(left + pastedDigits + right, maxDigits);
      setDigits(newDigits);

      setTimeout(() => {
        const pos = formatter.getCaretPosition(insertIndex + pastedDigits.length);
        setCaret(el, pos);
      }, 0);
    },
    [digits, formatter]
  );

  // Attach event listeners
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    el.setAttribute('type', 'tel');
    el.setAttribute('inputmode', 'tel');
    el.setAttribute('placeholder', formatter.getPlaceholder());

    const beforeInputHandler = handleBeforeInput as unknown as (evt: Event) => void;
    const keydownHandler = handleKeydown as unknown as (evt: Event) => void;
    const pasteHandler = handlePaste as unknown as (evt: Event) => void;

    el.addEventListener('beforeinput', beforeInputHandler);
    el.addEventListener('input', handleInput);
    el.addEventListener('keydown', keydownHandler);
    el.addEventListener('paste', pasteHandler);

    return () => {
      el.removeEventListener('beforeinput', beforeInputHandler);
      el.removeEventListener('input', handleInput);
      el.removeEventListener('keydown', keydownHandler);
      el.removeEventListener('paste', pasteHandler);
    };
  }, [handleBeforeInput, handleInput, handleKeydown, handlePaste, formatter]);

  const setCountry = useCallback((countryCode: string) => {
    const newCountry = getCountry(countryCode, locale);
    if (newCountry) {
      setCountryState(newCountry);
      const newFormatter = createPhoneFormatter(newCountry);
      const maxDigits = newFormatter.getMaxDigits();
      if (digits.length > maxDigits) {
        setDigits(digits.slice(0, maxDigits));
      }
      options.onCountryChange?.(newCountry);
    }
  }, [locale, digits, options]);

  const clear = useCallback(() => {
    setDigits('');
    const el = inputRef.current;
    if (el) {
      el.value = '';
    }
  }, []);

  return {
    ref: inputRef,
    digits,
    full,
    fullFormatted,
    isComplete,
    isEmpty,
    shouldShowWarn,
    country,
    setCountry,
    clear
  };
}
