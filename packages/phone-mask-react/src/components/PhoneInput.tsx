import React, {
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type CSSProperties,
  type Ref
} from 'react';
import { createPortal } from 'react-dom';
import { getMasksFullMapByLocale, type CountryKey, type MaskFull } from '@desource/phone-mask';
import { extractDigits, getSelection } from '../utils';
import { Delimiters, NavigationKeys, InvalidPattern } from '../consts';
import { usePhoneMaskCore } from '../hooks/usePhoneMaskCore';
import { useTimer } from '../hooks/useTimer';

import type { PhoneInputProps, PhoneInputRef } from '../types';

/** Get all countries */
function getCountries(locale: string): MaskFull[] {
  const map = getMasksFullMapByLocale(locale);

  return Object.entries(map).map(([id, data]) => ({ id: id as CountryKey, ...data }));
}

type PhoneInputComponent = PhoneInputProps & { ref?: Ref<PhoneInputRef> };

export const PhoneInput = ({ ref, ...props }: PhoneInputComponent) => {
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
    onPhoneChange,
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

  // Compute digits from value prop (fully controlled)
  const digits = useMemo(() => extractDigits(value || ''), [value]);

  const {
    country,
    locale,
    formatter,
    displayValue,
    full,
    fullFormatted,
    isComplete,
    isEmpty,
    setCountry,
    scheduleCaretUpdate
  } = usePhoneMaskCore({
    country: propCountry,
    locale: propLocale,
    detect,
    value: digits, // Pass computed digits
    onChange: onPhoneChange,
    onCountryChange: onCountryChange
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const [showValidationHint, setShowValidationHint] = useState(false);
  const [hasDropdown, setHasDropdown] = useState<boolean>(!propCountry);

  const validationTimer = useTimer();
  const closeTimer = useTimer();
  const copyTimer = useTimer();

  const countries = useMemo(() => getCountries(locale), [locale]);

  const displayPlaceholder = formatter.getPlaceholder();
  const shouldShowWarn = showValidationHint && !isEmpty && !isComplete;

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

  // Clamp digits formatter changes
  useEffect(() => {
    const maxDigits = formatter.getMaxDigits();
    if (digits.length > maxDigits) {
      onChange?.(digits.slice(0, maxDigits));
    }
  }, [formatter, digits, onChange]);

  // Country initialization and detection with cache + locale fallback
  useEffect(() => {
    setHasDropdown(!propCountry && countries.length > 1);
  }, [propCountry, countries]);

  // Notify validation changes
  useEffect(() => {
    onValidationChange?.(isComplete);
  }, [isComplete, onValidationChange]);

  // Validation hint helpers
  const clearValidationHint = useCallback(() => {
    setShowValidationHint(false);
    validationTimer.clear();
  }, [validationTimer]);

  const scheduleValidationHint = useCallback(
    (delay: number) => {
      validationTimer.set(() => {
        setShowValidationHint(true);
      }, delay);
    },
    [validationTimer]
  );

  // Input handlers
  const handleBeforeInput = useCallback((e: InputEvent) => {
    const data = e.data;
    if (e.inputType !== 'insertText' || !data) return;
    const el = telRef.current;
    if (!el) return;
    if (InvalidPattern.test(data) || (data === ' ' && el.value.endsWith(' '))) {
      e.preventDefault();
    }
  }, []);

  const handleInput = useCallback(() => {
    const el = telRef.current;
    if (!el || inactive) return;
    const raw = el.value || '';
    const maxDigits = formatter.getMaxDigits();
    const newDigits = extractDigits(raw, maxDigits);
    onChange?.(newDigits);
    scheduleCaretUpdate(el, newDigits.length);
    // validation hint debounce (500ms)
    clearValidationHint();
    if (newDigits.length > 0) {
      scheduleValidationHint(500);
    }
  }, [formatter, inactive, onChange, clearValidationHint, scheduleValidationHint, scheduleCaretUpdate]);

  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      if (inactive) return;
      const el = telRef.current;
      if (!el) return;

      if (e.ctrlKey || e.metaKey || e.altKey || NavigationKeys.includes(e.key)) return;

      const [selStart, selEnd] = getSelection(el);

      // debounce validation hint during typing (300ms)
      clearValidationHint();
      const scheduleHint = () => scheduleValidationHint(300);

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (selStart !== selEnd) {
          const range = formatter.getDigitRange(digits, selStart, selEnd);
          if (range) {
            const [start, end] = range;
            onChange?.(digits.slice(0, start) + digits.slice(end));
            scheduleCaretUpdate(el, start);
          }
        } else if (selStart > 0) {
          let prevPos = selStart - 1;
          while (prevPos >= 0 && Delimiters.includes(el.value[prevPos]!)) prevPos--;
          if (prevPos >= 0) {
            const range = formatter.getDigitRange(digits, prevPos, prevPos + 1);
            if (range) {
              const [start] = range;
              onChange?.(digits.slice(0, start) + digits.slice(start + 1));
              scheduleCaretUpdate(el, start);
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
            onChange?.(digits.slice(0, start) + digits.slice(end));
            scheduleCaretUpdate(el, start);
          }
        } else if (selStart < el.value.length) {
          const range = formatter.getDigitRange(digits, selStart, selStart + 1);
          if (range) {
            const [start] = range;
            onChange?.(digits.slice(0, start) + digits.slice(start + 1));
            scheduleCaretUpdate(el, start);
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
    [inactive, formatter, digits, onChange, clearValidationHint, scheduleValidationHint, scheduleCaretUpdate]
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
          const newDigits = extractDigits(digits.slice(0, start) + pastedDigits + digits.slice(end), maxDigits);
          onChange?.(newDigits);
          scheduleCaretUpdate(el, start + pastedDigits.length);
        }
      } else {
        const range = formatter.getDigitRange(digits, selStart, selStart);
        const insertIndex = range ? range[0] : digits.length;
        const newDigits = extractDigits(
          digits.slice(0, insertIndex) + pastedDigits + digits.slice(insertIndex),
          maxDigits
        );
        onChange?.(newDigits);
        scheduleCaretUpdate(el, insertIndex + pastedDigits.length);
      }
      // show validation hint after paste (300ms)
      clearValidationHint();
      scheduleValidationHint(300);
    },
    [inactive, formatter, digits, onChange, clearValidationHint, scheduleValidationHint, scheduleCaretUpdate]
  );

  // Close dropdown with animation
  const closeDropdown = useCallback(() => {
    if (!dropdownOpen) return;
    setIsClosing(true);
    closeTimer.set(() => {
      setDropdownOpen(false);
      setIsClosing(false);
    }, 200);
  }, [dropdownOpen, closeTimer]);

  // Input focus behavior (close dropdown, clear validation hint)
  const handleFocusInput = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      clearValidationHint();
      closeDropdown();
      onFocus?.(e);
    },
    [onFocus, closeDropdown, clearValidationHint]
  );

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
      setCountry(code);
      closeDropdown();
      setSearch('');
      setFocusedIndex(0);
      setTimeout(() => telRef.current?.focus(), 0);
    },
    [setCountry, closeDropdown]
  );

  // Dropdown positioning
  const positionDropdown = useCallback(() => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    setDropdownStyle({
      top: `${rect.bottom + window.scrollY + 8}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`
    });
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;

    positionDropdown();
    const focusTimer = setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 0);

    const onDocClick = (ev: Event) => {
      const target = ev.target as Node | null;
      const dropdownEl = dropdownRef.current;
      const selectorEl = selectorRef.current;
      if (!target) return;
      if (dropdownEl?.contains(target)) return;
      if (selectorEl?.contains(target)) return;
      closeDropdown();
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
  }, [dropdownOpen, positionDropdown, closeDropdown]);

  // Copy functionality
  const handleCopyClick = useCallback(async () => {
    if (isCopying) return;
    const trimmedValue = fullFormatted.trim();
    if (!trimmedValue) return;

    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(trimmedValue);
      setCopied(true);
      onCopy?.(trimmedValue);
      if (liveRef.current) liveRef.current.textContent = 'Phone number copied to clipboard';

      copyTimer.set(() => {
        setCopied(false);
      }, 1800);
    } catch (err) {
      console.warn('Copy failed', err);
    } finally {
      setIsCopying(false);
    }
  }, [fullFormatted, onCopy, isCopying, copyTimer]);

  const clear = useCallback(() => {
    onChange?.('');
    clearValidationHint();
    onClear?.();
  }, [onChange, onClear, clearValidationHint]);

  // Clear functionality
  const handleClearClick = useCallback(() => {
    clear();
    setTimeout(() => telRef.current?.focus(), 0);
  }, [clear]);

  // Imperative handle
  useImperativeHandle(
    ref,
    () => ({
      focus: () => telRef.current?.focus(),
      blur: () => telRef.current?.blur(),
      clear,
      selectCountry,
      getFullNumber: () => full,
      getFullFormattedNumber: () => fullFormatted,
      getDigits: () => digits,
      isValid: () => isComplete,
      isComplete: () => isComplete
    }),
    [selectCountry, full, fullFormatted, digits, isComplete, clear]
  );

  const scrollFocusedIntoView = (index: number) => {
    setTimeout(() => {
      const list = dropdownRef.current?.lastElementChild;
      const option = list?.children[index];
      if (!list || !option) return;

      // Scroll only the list container with smooth behavior
      const listRect = list.getBoundingClientRect();
      const optionRect = option.getBoundingClientRect();

      let scrollAmount = 0;

      if (optionRect.top < listRect.top) {
        scrollAmount = list.scrollTop - (listRect.top - optionRect.top); // Option is above visible area
      } else if (optionRect.bottom > listRect.bottom) {
        scrollAmount = list.scrollTop + (optionRect.bottom - listRect.bottom); // Option is below visible area
      } else {
        return; // Already visible, no need to scroll
      }

      list.scrollTo({ top: scrollAmount, behavior: 'smooth' });
    }, 0);
  };

  // Keyboard navigation for dropdown
  const handleSearchKeydown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = Math.min(i + 1, filteredCountries.length - 1);
          scrollFocusedIntoView(next);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => {
          const prev = Math.max(i - 1, 0);
          scrollFocusedIntoView(prev);
          return prev;
        });
      } else if (e.key === 'Enter' && filteredCountries[focusedIndex]) {
        e.preventDefault();
        selectCountry(filteredCountries[focusedIndex]!.id);
      } else if (e.key === 'Escape') {
        closeDropdown();
      }
    },
    [filteredCountries, focusedIndex, selectCountry, closeDropdown]
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
              if (dropdownOpen) {
                closeDropdown();
              } else {
                closeTimer.clear();
                setIsClosing(false);
                setDropdownOpen(true);
                setFocusedIndex(0);
              }
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
            className={`phone-dropdown ${dropdownClass} ${themeClass} ${isClosing ? 'is-closing' : ''}`}
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
};

PhoneInput.displayName = 'PhoneInput';
