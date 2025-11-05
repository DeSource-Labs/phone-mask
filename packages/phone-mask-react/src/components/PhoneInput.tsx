import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type CSSProperties
} from 'react';
import { createPortal } from 'react-dom';
import { MasksFullMap, MasksFullMapEn, type CountryKey, type MaskFull } from '@desource/phone-mask';
import { createPhoneFormatter, extractDigits, setCaret, getSelection } from '../utils';
import { Delimiters, NavigationKeys, InvalidPattern, GEO_IP_URL, GEO_IP_TIMEOUT, CACHE_KEY, CACHE_EXPIRY_MS } from '../consts';
import type { PhoneInputProps, PhoneInputRef, PhoneNumber } from '../types';

/** Get navigator language */
function getNavigatorLang(): string {
  return typeof navigator !== 'undefined' ? navigator.language || 'en' : 'en';
}

/** Get country by code */
function getCountry(code: string, locale: string): MaskFull {
  const isEn = locale.toLowerCase().startsWith('en');
  const map = isEn ? MasksFullMapEn : MasksFullMap(locale);
  const id = code.toUpperCase() as CountryKey;
  const data = map[id] || map.US;
  return { id: (map[id] ? id : 'US') as CountryKey, ...data };
}

/** Get all countries */
function getCountries(locale: string): MaskFull[] {
  const isEn = locale.toLowerCase().startsWith('en');
  const map = isEn ? MasksFullMapEn : MasksFullMap(locale);
  return Object.entries(map).map(([id, data]) => ({ id: id as CountryKey, ...data }));
}

//

/**
 * PhoneInput Component
 * 
 * A comprehensive phone number input with country selector, masking, and validation.
 */
export const PhoneInput = forwardRef<PhoneInputRef, PhoneInputProps>((props, ref) => {
  const {
    value = '',
    country: propCountry,
    detect = true,
    locale: propLocale,
    size = 'normal',
    theme = 'auto',
    disabled = false,
    readonly = false,
    showCopy = true,
    showClear = false,
    withValidity = true,
    searchPlaceholder = 'Search country or code...',
    noResultsText = 'No countries found',
    clearButtonLabel = 'Clear phone number',
    dropdownClass = '',
    disableDefaultStyles = false,
    onChange,
    onCountryChange,
    onValidationChange,
    onFocus,
    onBlur,
    onCopy,
    onClear,
    renderActionsBefore,
    renderFlag,
    renderCopySvg,
    renderClearSvg
  } = props;

  const telRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  const locale = propLocale || getNavigatorLang();
  const [country, setCountry] = useState<MaskFull>(() => getCountry(propCountry || 'US', locale));
  const [digits, setDigits] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const [showValidationHint, setShowValidationHint] = useState(false);
  const validationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasDropdown, setHasDropdown] = useState<boolean>(!propCountry);

  const formatter = useMemo(() => createPhoneFormatter(country), [country]);
  const countries = useMemo(() => getCountries(locale), [locale]);

  const displayValue = formatter.formatDisplay(digits);
  const displayPlaceholder = formatter.getPlaceholder();
  const isComplete = formatter.isComplete(digits);
  const isEmpty = digits.length === 0;
  const shouldShowWarn = showValidationHint && !isEmpty && !isComplete;

  const full = `${country.code}${digits}`;
  const fullFormatted = digits ? `${country.code} ${displayValue}` : '';

  const filteredCountries = useMemo(() => {
    const raw = search.trim();
    if (!raw) return countries;
    const q = raw.toUpperCase();
    const qDigits = q.replace(/\D/g, '');
    const isNumeric = qDigits.length > 0;

    return countries
      .map((c) => {
        const nameUpper = c.name.toUpperCase();
        const idUpper = c.id.toUpperCase();
        const codeUpper = c.code.toUpperCase();
        const codeDigits = c.code.replace(/\D/g, '');
        let score = 0;
        if (nameUpper.startsWith(q)) score = 1000;
        else if (nameUpper.includes(q)) score = 500;

        if (codeUpper.startsWith(q)) score += 100;
        else if (codeUpper.includes(q)) score += 50;

        if (idUpper === q) score += 200;
        else if (idUpper.startsWith(q)) score += 150;

        if (isNumeric && codeDigits.startsWith(qDigits)) score += 80;
        else if (isNumeric && codeDigits.includes(qDigits)) score += 40;

        return { country: c, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.country.name.localeCompare(b.country.name)))
      .map((x) => x.country);
  }, [countries, search]);

  const inactive = disabled || readonly;
  const showCopyButton = showCopy && !isEmpty && !disabled;
  const showClearButton = showClear && !isEmpty && !inactive;

  // Country initialization and detection with cache + locale fallback
  useEffect(() => {
    setHasDropdown(!propCountry && countries.length > 1);

    const hasCountry = (code?: string | null) => {
      if (!code) return false;
      const id = code.toUpperCase();
      return countries.some((c) => c.id === id);
    };

    const detectFromLocale = (): string | null => {
      const lang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : '';
      // Use Intl.Locale when available
      try {
        if (Intl.Locale) {
          const loc = new Intl.Locale(lang);
          if (loc?.region && hasCountry(loc.region)) return loc.region.toUpperCase();
        }
      } catch { /* ignore */ }
      const parts = lang.split(/[-_]/);
      if (parts.length > 1 && hasCountry(parts[1])) return parts[1].toUpperCase();
      return null;
    };

    const detectByGeoIp = async (): Promise<string | null> => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as { country_code?: string; ts: number };
          const expired = Date.now() - parsed.ts > CACHE_EXPIRY_MS;
          if (!expired && parsed.country_code && hasCountry(parsed.country_code)) {
            return parsed.country_code.toUpperCase();
          }
          if (expired) localStorage.removeItem(CACHE_KEY);
        }
      } catch { /* ignore */ }

      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), GEO_IP_TIMEOUT);
      try {
        const res = await fetch(GEO_IP_URL, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!res.ok) return null;
        const json = await res.json();
        const raw = (json.country || json.country_code || json.countryCode || json.country_code2 || '')
          .toString()
          .toUpperCase();
        if (hasCountry(raw)) {
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ country_code: raw, ts: Date.now() })); } catch { /* ignore */ }
          return raw;
        }
      } catch { /* ignore */ }
      finally { clearTimeout(t); }
      return null;
    };

    (async () => {
      if (propCountry && hasCountry(propCountry)) {
        const newCountry = getCountry(propCountry, locale);
        setCountry((prev) => (prev.id === newCountry.id ? prev : newCountry));
        return;
      }
      if (!detect) return;
      const geo = await detectByGeoIp();
      if (geo) {
        const detected = getCountry(geo, locale);
        setCountry((prev) => (prev.id === detected.id ? prev : detected));
        onCountryChange?.(detected);
        return;
      }
      const loc = detectFromLocale();
      if (loc) {
        const detected = getCountry(loc, locale);
        setCountry((prev) => (prev.id === detected.id ? prev : detected));
        onCountryChange?.(detected);
      }
    })();
  }, [propCountry, detect, countries, locale, onCountryChange]);

  // Clamp digits when country or formatter changes
  useEffect(() => {
    const maxDigits = formatter.getMaxDigits();
    if (digits.length > maxDigits) {
      setDigits((d) => d.slice(0, maxDigits));
    }
  }, [formatter]);

  // Sync value prop
  useEffect(() => {
    const incomingDigits = extractDigits(value || '');
    if (incomingDigits !== digits) {
      setDigits(incomingDigits);
    }
  }, [value]);

  // Notify validation changes
  useEffect(() => {
    onValidationChange?.(isComplete);
  }, [isComplete, onValidationChange]);

  // Emit onChange
  const emitChange = useCallback(() => {
    const phoneData: PhoneNumber = { full, fullFormatted, digits };
    onChange?.(phoneData);
  }, [full, fullFormatted, digits, onChange]);

  useEffect(() => {
    emitChange();
  }, [emitChange]);

  // Input handlers
  const handleBeforeInput = useCallback(
    (e: InputEvent) => {
      const data = e.data;
      if (e.inputType !== 'insertText' || !data) return;
      const el = telRef.current;
      if (!el) return;
      if (InvalidPattern.test(data) || (data === ' ' && el.value.endsWith(' '))) {
        e.preventDefault();
      }
    },
    []
  );

  const handleInput = useCallback(() => {
    const el = telRef.current;
    if (!el || inactive) return;
    const raw = el.value || '';
    const maxDigits = formatter.getMaxDigits();
    const newDigits = extractDigits(raw, maxDigits);
    setDigits(newDigits);
    setTimeout(() => {
      const pos = formatter.getCaretPosition(newDigits.length);
      setCaret(el, pos);
    }, 0);
    // validation hint debounce (500ms)
    setShowValidationHint(false);
    if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    if (newDigits.length > 0) {
      validationTimerRef.current = setTimeout(() => {
        setShowValidationHint(true);
      }, 500);
    }
  }, [formatter, inactive]);

  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      if (inactive) return;
      const el = telRef.current;
      if (!el) return;

      if (e.ctrlKey || e.metaKey || e.altKey || NavigationKeys.includes(e.key)) return;

      const [selStart, selEnd] = getSelection(el);

      // debounce validation hint during typing (300ms)
      setShowValidationHint(false);
      if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
      const scheduleHint = () => {
        if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
        validationTimerRef.current = setTimeout(() => {
          setShowValidationHint(true);
        }, 300);
      };

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (selStart !== selEnd) {
          const range = formatter.getDigitRange(digits, selStart, selEnd);
          if (range) {
            const [start, end] = range;
            setDigits(digits.slice(0, start) + digits.slice(end));
            setTimeout(() => setCaret(el, formatter.getCaretPosition(start)), 0);
          }
        } else if (selStart > 0) {
          let prevPos = selStart - 1;
          while (prevPos >= 0 && Delimiters.includes(el.value[prevPos]!)) prevPos--;
          if (prevPos >= 0) {
            const range = formatter.getDigitRange(digits, prevPos, prevPos + 1);
            if (range) {
              const [start] = range;
              setDigits(digits.slice(0, start) + digits.slice(start + 1));
              setTimeout(() => setCaret(el, formatter.getCaretPosition(start)), 0);
            }
          }
        }
        scheduleHint();
        return;
      }

      if (e.key === 'Delete') {
        e.preventDefault();
        if (selStart !== selEnd) {
          const range = formatter.getDigitRange(digits, selStart, selEnd);
          if (range) {
            const [start, end] = range;
            setDigits(digits.slice(0, start) + digits.slice(end));
            setTimeout(() => setCaret(el, formatter.getCaretPosition(start)), 0);
          }
        } else if (selStart < el.value.length) {
          const range = formatter.getDigitRange(digits, selStart, selStart + 1);
          if (range) {
            const [start] = range;
            setDigits(digits.slice(0, start) + digits.slice(start + 1));
            setTimeout(() => setCaret(el, formatter.getCaretPosition(start)), 0);
          }
        }
        scheduleHint();
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        if (digits.length >= formatter.getMaxDigits()) e.preventDefault();
        scheduleHint();
        return;
      }

      if (e.key.length === 1) e.preventDefault();
      scheduleHint();
    },
    [inactive, formatter, digits]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (inactive) return;
      e.preventDefault();
      const el = telRef.current;
      if (!el) return;

      const text = e.clipboardData?.getData('text') || '';
      const maxDigits = formatter.getMaxDigits();
      const pastedDigits = extractDigits(text, maxDigits);
      if (!pastedDigits) return;

      const [selStart, selEnd] = getSelection(el);
      if (selStart !== selEnd) {
        const range = formatter.getDigitRange(digits, selStart, selEnd);
        if (range) {
          const [start, end] = range;
          const newDigits = extractDigits(
            digits.slice(0, start) + pastedDigits + digits.slice(end),
            maxDigits
          );
          setDigits(newDigits);
          setTimeout(() => setCaret(el, formatter.getCaretPosition(start + pastedDigits.length)), 0);
        }
      } else {
        const range = formatter.getDigitRange(digits, selStart, selStart);
        const insertIndex = range ? range[0] : digits.length;
        const newDigits = extractDigits(
          digits.slice(0, insertIndex) + pastedDigits + digits.slice(insertIndex),
          maxDigits
        );
        setDigits(newDigits);
        setTimeout(() => setCaret(el, formatter.getCaretPosition(insertIndex + pastedDigits.length)), 0);
      }
      // show validation hint after paste (300ms)
      setShowValidationHint(false);
      if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
      validationTimerRef.current = setTimeout(() => {
        setShowValidationHint(true);
      }, 300);
    },
    [inactive, formatter, digits]
  );

  // Input focus behavior (close dropdown, keep existing hint state)
  const handleFocusInput = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    setDropdownOpen(false);
    onFocus?.(e);
  }, [onFocus]);

  // Attach native event listeners
  useEffect(() => {
    const el = telRef.current;
    if (!el) return;

    const beforeInputHandler = handleBeforeInput as unknown as (evt: Event) => void;
    const keydownHandler = handleKeydown as unknown as (evt: Event) => void;
    const pasteHandler = handlePaste as unknown as (evt: Event) => void;

    el.addEventListener('beforeinput', beforeInputHandler);
    el.addEventListener('keydown', keydownHandler);
    el.addEventListener('paste', pasteHandler);

    return () => {
      el.removeEventListener('beforeinput', beforeInputHandler);
      el.removeEventListener('keydown', keydownHandler);
      el.removeEventListener('paste', pasteHandler);
    };
  }, [handleBeforeInput, handleKeydown, handlePaste]);

  // Country selection
  const selectCountry = useCallback(
    (code: CountryKey) => {
      const newCountry = getCountry(code, locale);
      setCountry(newCountry);
      setDropdownOpen(false);
      setSearch('');
      setFocusedIndex(0);
      onCountryChange?.(newCountry);
      setTimeout(() => telRef.current?.focus(), 0);
    },
    [locale, onCountryChange]
  );

  // Dropdown positioning
  const positionDropdown = useCallback(() => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    setDropdownStyle({
      top: `${rect.bottom + window.scrollY + 8}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`,
    });
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;

    positionDropdown();
    const focusTimer = setTimeout(() => searchRef.current?.focus(), 0);

    const onDocClick = (ev: Event) => {
      const target = ev.target as Node | null;
      const dropdownEl = dropdownRef.current;
      const selectorEl = selectorRef.current;
      if (!target) return;
      if (dropdownEl?.contains(target)) return;
      if (selectorEl?.contains(target)) return;
      setDropdownOpen(false);
    };

    window.addEventListener('resize', positionDropdown);
    window.addEventListener('scroll', positionDropdown, true);
    window.addEventListener('click', onDocClick, true);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('resize', positionDropdown);
      window.removeEventListener('scroll', positionDropdown, true);
      window.removeEventListener('click', onDocClick, true);
    };
  }, [dropdownOpen, positionDropdown]);

  // Copy functionality
  const handleCopyClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullFormatted);
      setCopied(true);
      onCopy?.(fullFormatted);
      if (liveRef.current) liveRef.current.textContent = 'Phone number copied to clipboard';
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [fullFormatted, onCopy]);

  // Clear functionality
  const handleClearClick = useCallback(() => {
    setDigits('');
    onClear?.();
    setTimeout(() => telRef.current?.focus(), 0);
  }, [onClear]);

  // Imperative handle
  useImperativeHandle(
    ref,
    () => ({
      focus: () => telRef.current?.focus(),
      blur: () => telRef.current?.blur(),
      clear: () => {
        setDigits('');
        onClear?.();
      },
      selectCountry,
      getFullNumber: () => full,
      getFullFormattedNumber: () => fullFormatted,
      getDigits: () => digits,
      isValid: () => isComplete,
      isComplete: () => isComplete
    }),
    [selectCountry, full, fullFormatted, digits, isComplete, onClear]
  );

  // Keyboard navigation for dropdown
  const handleSearchKeydown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = Math.min(i + 1, filteredCountries.length - 1);
          setTimeout(() => {
            const list = dropdownRef.current?.lastElementChild as HTMLUListElement | null;
            list?.children[next]?.scrollIntoView?.({ block: 'nearest' });
          }, 0);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => {
          const prev = Math.max(i - 1, 0);
          setTimeout(() => {
            const list = dropdownRef.current?.lastElementChild as HTMLUListElement | null;
            list?.children[prev]?.scrollIntoView?.({ block: 'nearest' });
          }, 0);
          return prev;
        });
      } else if (e.key === 'Enter' && filteredCountries[focusedIndex]) {
        e.preventDefault();
        selectCountry(filteredCountries[focusedIndex]!.id);
      } else if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    },
    [filteredCountries, focusedIndex, selectCountry]
  );

  // Theme class
  const themeClass = useMemo(() => {
    if (theme !== 'auto') return `theme-${theme}`;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'theme-dark';
    }
    return 'theme-light';
  }, [theme]);

  const rootClasses = [
    'phone-input',
    `size-${size}`,
    themeClass,
    disabled && 'is-disabled',
    readonly && 'is-readonly',
    disableDefaultStyles && 'is-unstyled',
    withValidity && shouldShowWarn && 'is-incomplete',
    withValidity && isComplete && 'is-complete'
  ]
    .filter(Boolean)
    .join(' ');

  const actionsCount = +showCopyButton + +showClearButton + (renderActionsBefore ? 1 : 0);

  return (
    <>
      <div
        ref={rootRef}
        className={rootClasses}
        style={{ '--pi-actions-count': actionsCount } as CSSProperties}
        role="group"
        aria-label="Phone input with country selector"
      >
        {/* Country Selector */}
        <div className="pi-selector" ref={selectorRef}>
          <button
            type="button"
            className={`pi-selector-btn ${!hasDropdown || readonly ? 'no-dropdown' : ''}`}
            disabled={disabled}
            tabIndex={inactive || !hasDropdown ? -1 : undefined}
            aria-label={`Selected country: ${country.name}`}
            aria-expanded={dropdownOpen}
            aria-haspopup={hasDropdown ? 'listbox' : undefined}
            onClick={() => {
              if (inactive || !hasDropdown) return;
              setDropdownOpen((o) => {
                const next = !o;
                if (next) setFocusedIndex(0);
                return next;
              });
            }}
          >
            <span className="pi-flag" role="img" aria-label={`${country.name} flag`}>
              {renderFlag ? renderFlag(country) : country.flag}
            </span>
            <span className="pi-code">{country.code}</span>
            {!inactive && hasDropdown && (
              <svg
                className={`pi-chevron ${dropdownOpen ? 'is-open' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2.5 4.5L6 8L9.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Input Container */}
        <div className="pi-input-wrap">
          <input
            ref={telRef}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="pi-input"
            placeholder={displayPlaceholder}
            value={displayValue}
            disabled={disabled}
            readOnly={readonly}
            aria-invalid={shouldShowWarn}
            onInput={handleInput}
            onFocus={handleFocusInput}
            onBlur={onBlur}
          />

          {/* Action Buttons */}
          <div className="pi-actions" role="toolbar" aria-label="Phone input actions">
            {renderActionsBefore && renderActionsBefore()}

            {showCopyButton && (
              <button
                type="button"
                className={`pi-btn ${copied ? 'is-copied' : ''}`}
                aria-label={copied ? 'Copied' : `Copy ${country.code} ${displayValue}`}
                title={copied ? 'Copied' : 'Copy phone number'}
                onClick={handleCopyClick}
              >
                {renderCopySvg ? (
                  renderCopySvg(copied)
                ) : copied ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6.5 11.5L3 8L4.06 6.94L6.5 9.38L11.94 3.94L13 5L6.5 11.5Z" fill="currentColor" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M13.5 5.5V13.5H5.5V5.5H13.5ZM13.5 4H5.5C4.67 4 4 4.67 4 5.5V13.5C4 14.33 4.67 15 5.5 15H13.5C14.33 15 15 14.33 15 13.5V5.5C15 4.67 14.33 4 13.5 4ZM10.5 1H2.5V11H4V2.5H10.5V1Z"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </button>
            )}

            {showClearButton && (
              <button
                type="button"
                className="pi-btn"
                aria-label={clearButtonLabel}
                title={clearButtonLabel}
                onClick={handleClearClick}
              >
                {renderClearSvg ? (
                  renderClearSvg()
                ) : (
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {dropdownOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`phone-dropdown ${dropdownClass} ${themeClass}`}
            style={dropdownStyle}
            role="dialog"
            aria-modal="false"
            aria-label="Select country"
          >
            <div className="pi-search-wrap">
              <input
                ref={searchRef}
                type="search"
                className="pi-search"
                aria-label="Search countries"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setFocusedIndex(0);
                }}
                onKeyDown={handleSearchKeydown}
              />
            </div>
            <ul className="pi-options" role="listbox" aria-activedescendant={`option-${focusedIndex}`} tabIndex={-1}>
              {filteredCountries.length > 0 ? (
                filteredCountries.map((c, idx) => (
                  <li
                    key={c.id}
                    id={`option-${idx}`}
                    role="option"
                    className={`pi-option ${idx === focusedIndex ? 'is-focused' : ''} ${
                      c.id === country.id ? 'is-selected' : ''
                    }`}
                    aria-selected={c.id === country.id}
                    title={c.name}
                    onClick={() => selectCountry(c.id)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                  >
                    <span className="pi-flag" role="img" aria-label={`${c.name} flag`}>
                      {renderFlag ? renderFlag(c) : c.flag}
                    </span>
                    <span className="pi-opt-name">{c.name}</span>
                    <span className="pi-opt-code">{c.code}</span>
                  </li>
                ))
              ) : (
                <li className="pi-empty">{noResultsText}</li>
              )}
            </ul>
          </div>,
          document.body
        )}

      {/* Screen reader announcements */}
      <div ref={liveRef} className="sr-only" role="status" aria-live="polite" aria-atomic="true" />
    </>
  );
});

PhoneInput.displayName = 'PhoneInput';
