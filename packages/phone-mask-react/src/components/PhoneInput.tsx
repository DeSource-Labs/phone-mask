import React, { useImperativeHandle, useRef, useCallback, type CSSProperties, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { useFormatter } from '../hooks/internal/useFormatter';
import { useCountry } from '../hooks/internal/useCountry';
import { useValidationHint } from '../hooks/internal/useValidationHint';
import { useInputHandlers } from '../hooks/internal/useInputHandlers';
import { useCountrySelector } from '../hooks/internal/useCountrySelector';
import { useCopyAction } from '../hooks/internal/useCopyAction';
import { useTheme } from '../hooks/internal/useTheme';

import type { PhoneInputProps, PhoneInputRef } from '../types';

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

  const { country, setCountry, locale } = useCountry({
    country: propCountry,
    locale: propLocale,
    detect,
    onCountryChange
  });

  const {
    digits,
    formatter,
    displayPlaceholder,
    displayValue,
    full,
    fullFormatted,
    isComplete,
    isEmpty,
    shouldShowWarn
  } = useFormatter({
    country,
    value,
    onChange,
    onPhoneChange,
    onValidationChange
  });

  const { showValidationHint, clearValidationHint, scheduleValidationHint } = useValidationHint();

  const telRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  const inactive = disabled || readonly;
  const incomplete = showValidationHint && shouldShowWarn;

  const showCopyButton = showCopy && !isEmpty && !disabled;
  const showClearButton = showClear && !isEmpty && !inactive;

  const {
    copied,
    copyAriaLabel,
    copyButtonTitle,
    onCopyClick: handleCopyClick
  } = useCopyAction({
    liveRef,
    fullFormatted,
    onCopy
  });

  const focusInput = useCallback(() => {
    setTimeout(() => telRef.current?.focus(), 0);
  }, []);

  const { handleBeforeInput, handleInput, handleKeydown, handlePaste } = useInputHandlers({
    formatter,
    digits,
    inactive,
    onChange,
    scheduleValidationHint
  });

  const {
    dropdownOpen,
    isClosing,
    search,
    focusedIndex,
    dropdownStyle,
    filteredCountries,
    hasDropdown,
    closeDropdown,
    toggleDropdown,
    selectCountry,
    setFocusedIndex,
    handleSearchChange,
    handleSearchKeydown,
    handleDropdownAnimationEnd
  } = useCountrySelector({
    rootRef,
    dropdownRef,
    searchRef,
    selectorRef,
    locale,
    inactive,
    countryOption: propCountry,
    onSelectCountry: setCountry,
    onAfterSelect: focusInput
  });

  // Input focus behavior (close dropdown, clear validation timer, and call onFocus callback)
  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      clearValidationHint(false);
      closeDropdown();
      onFocus?.(e);
    },
    [onFocus, closeDropdown, clearValidationHint]
  );

  const clear = useCallback(() => {
    onChange?.('');
    clearValidationHint();
    onClear?.();
  }, [onChange, onClear, clearValidationHint]);

  // Clear functionality
  const handleClearClick = useCallback(() => {
    clear();
    focusInput();
  }, [clear, focusInput]);

  // Imperative handle
  useImperativeHandle(
    ref,
    () => ({
      focus: focusInput,
      blur: () => telRef.current?.blur(),
      clear,
      selectCountry,
      getFullNumber: () => full,
      getFullFormattedNumber: () => fullFormatted,
      getDigits: () => digits,
      isValid: () => isComplete,
      isComplete: () => isComplete
    }),
    [focusInput, selectCountry, full, fullFormatted, digits, isComplete, clear]
  );

  const { themeClass } = useTheme({ theme });

  const rootClasses = [
    'phone-input',
    `size-${size}`,
    themeClass,
    disabled && 'is-disabled',
    readonly && 'is-readonly',
    disableDefaultStyles && 'is-unstyled',
    withValidity && incomplete && 'is-incomplete',
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
            onClick={toggleDropdown}
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
            aria-invalid={incomplete}
            onInput={handleInput}
            onBeforeInput={handleBeforeInput}
            onKeyDown={handleKeydown}
            onPaste={handlePaste}
            onFocus={handleFocus}
            onBlur={onBlur}
          />

          {/* Action Buttons */}
          <div className="pi-actions" role="toolbar" aria-label="Phone input actions">
            {renderActionsBefore && renderActionsBefore()}

            {showCopyButton && (
              <button
                type="button"
                className={`pi-btn pi-btn-copy ${copied ? 'is-copied' : ''}`}
                aria-label={copyAriaLabel}
                title={copyButtonTitle}
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
                className="pi-btn pi-btn-clear"
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
            onAnimationEnd={handleDropdownAnimationEnd}
          >
            <div className="pi-search-wrap">
              <input
                ref={searchRef}
                type="search"
                className="pi-search"
                aria-label="Search countries"
                placeholder={searchPlaceholder}
                value={search}
                onChange={handleSearchChange}
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
