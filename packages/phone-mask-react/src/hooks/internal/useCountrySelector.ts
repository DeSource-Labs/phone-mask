import React, { useState, useCallback, useMemo, useEffect, type RefObject, type CSSProperties } from 'react';

import { MasksFull, filterCountries, type CountryKey } from '@desource/phone-mask';

interface UseCountrySelectOptions {
  rootRef: RefObject<HTMLDivElement | null>;
  dropdownRef: RefObject<HTMLDivElement | null>;
  searchRef: RefObject<HTMLInputElement | null>;
  selectorRef: RefObject<HTMLDivElement | null>;
  locale: string;
  onSelectCountry: (code: CountryKey) => void;
  countryOption?: string;
  inactive?: boolean;
  onAfterSelect?: () => void;
}

export function useCountrySelector({
  rootRef,
  dropdownRef,
  searchRef,
  selectorRef,
  locale,
  countryOption,
  inactive,
  onSelectCountry,
  onAfterSelect
}: UseCountrySelectOptions) {
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const [isClosing, setIsClosing] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const countries = useMemo(() => MasksFull(locale), [locale]);
  const filteredCountries = useMemo(() => filterCountries(countries, search), [countries, search]);
  const hasDropdown = useMemo(() => !countryOption && countries.length > 1, [countryOption, countries]);

  const focusSearch = useCallback(() => {
    setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 0);
  }, []);

  // Close dropdown with animation — actual DOM removal happens in handleDropdownAnimationEnd
  const closeDropdown = useCallback(() => {
    if (!dropdownOpen) return;
    setIsClosing(true);
  }, [dropdownOpen]);

  const openDropdown = useCallback(() => {
    setIsClosing(false);
    setDropdownOpen(true);
    setFocusedIndex(0);
    focusSearch();
  }, [focusSearch]);

  // Called via onAnimationEnd on the dropdown element
  const handleDropdownAnimationEnd = useCallback(() => {
    if (!isClosing) return;
    setDropdownOpen(false);
    setIsClosing(false);
  }, [isClosing]);

  const toggleDropdown = useCallback(() => {
    if (inactive || !hasDropdown) return;
    if (dropdownOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }, [inactive, dropdownOpen, hasDropdown, openDropdown, closeDropdown]);

  const selectCountry = useCallback(
    (code: CountryKey) => {
      onSelectCountry(code);
      closeDropdown();
      setSearch('');
      setFocusedIndex(0);
      onAfterSelect?.();
    },
    [onSelectCountry, closeDropdown, onAfterSelect]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setFocusedIndex(0);
  }, []);

  // Close dropdown on outside click
  const onDocClick = useCallback(
    (ev: Event) => {
      const target = ev.target as Node | null;
      const dropdownEl = dropdownRef.current;
      const selectorEl = selectorRef.current;
      if (!target) return;
      if (dropdownEl?.contains(target)) return;
      if (selectorEl?.contains(target)) return;
      closeDropdown();
    },
    [closeDropdown]
  );

  // Dropdown positioning
  const positionDropdown = useCallback((e?: Event | UIEvent) => {
    if (e?.type === 'scroll' && e.target && dropdownRef.current?.contains(e.target as Node)) return;
    if (!rootRef?.current) return;

    const rect = rootRef.current.getBoundingClientRect();

    setDropdownStyle({
      top: `${rect.bottom + globalThis.scrollY + 8}px`,
      left: `${rect.left + globalThis.scrollX}px`,
      width: `${rect.width}px`
    });
  }, []);

  const scrollFocusedIntoView = useCallback((index: number) => {
    setTimeout(() => {
      const list = dropdownRef.current?.lastElementChild;
      const option = list?.children[index];
      if (!list || !option) return;

      const listRect = list.getBoundingClientRect();
      const optionRect = option.getBoundingClientRect();

      let scrollAmount = 0;

      if (optionRect.top < listRect.top) {
        scrollAmount = list.scrollTop - (listRect.top - optionRect.top);
      } else if (optionRect.bottom > listRect.bottom) {
        scrollAmount = list.scrollTop + (optionRect.bottom - listRect.bottom);
      } else {
        return;
      }

      list.scrollTo({ top: scrollAmount, behavior: 'smooth' });
    }, 0);
  }, []);

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
    [filteredCountries, focusedIndex, selectCountry, closeDropdown, scrollFocusedIntoView]
  );

  useEffect(() => {
    if (!hasDropdown && dropdownOpen) {
      closeDropdown();
    }
  }, [hasDropdown, dropdownOpen, closeDropdown]);

  useEffect(() => {
    if (!dropdownOpen) return;

    positionDropdown();

    globalThis.addEventListener('resize', positionDropdown);
    globalThis.addEventListener('scroll', positionDropdown, true);
    globalThis.addEventListener('click', onDocClick, true);

    return () => {
      globalThis.removeEventListener('resize', positionDropdown);
      globalThis.removeEventListener('scroll', positionDropdown, true);
      globalThis.removeEventListener('click', onDocClick, true);
    };
  }, [dropdownOpen, positionDropdown, onDocClick]);

  return {
    // State
    dropdownOpen,
    isClosing,
    search,
    focusedIndex,
    dropdownStyle,
    // Derived
    filteredCountries,
    hasDropdown,
    // Actions
    openDropdown,
    closeDropdown,
    toggleDropdown,
    selectCountry,
    setFocusedIndex,
    handleSearchChange,
    handleSearchKeydown,
    handleDropdownAnimationEnd
  };
}
