import React, { useState, useCallback, useMemo, useEffect, useRef, type RefObject } from 'react';

import { MasksFull, type CountryKey } from '@desource/phone-mask';
import {
  bindCountryDropdownListeners,
  filterCountries,
  handleCountryButtonKeydown,
  handleCountrySearchKeydown,
  positionCountryDropdown,
  scrollCountryOptionIntoView
} from '@desource/phone-mask/kit';

interface UseCountrySelectOptions {
  rootRef: RefObject<HTMLDivElement | null>;
  dropdownRef: RefObject<HTMLDivElement | null>;
  searchRef: RefObject<HTMLInputElement | null>;
  selectorRef: RefObject<HTMLButtonElement | null>;
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
  const [focusedIndex, setFocusedIndex] = useState(0);
  const openByKeyboardRef = useRef(false);

  const countries = useMemo(() => MasksFull(locale), [locale]);
  const filteredCountries = useMemo(() => filterCountries(countries, search), [countries, search]);
  const hasDropdown = !countryOption && countries.length > 1;

  const resetDropdownState = useCallback(() => {
    setSearch('');
    setFocusedIndex(0);
    openByKeyboardRef.current = false;
  }, []);

  const updateDropdownPosition = useCallback(() => {
    positionCountryDropdown(rootRef.current, dropdownRef.current);
  }, [dropdownRef, rootRef]);

  const focusSearch = useCallback(() => {
    setTimeout(() => searchRef.current?.focus({ preventScroll: true }));
  }, [searchRef]);

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
    resetDropdownState();
  }, [resetDropdownState]);

  const openDropdown = useCallback(() => {
    if (inactive || !hasDropdown || dropdownOpen || !dropdownRef.current || !selectorRef.current) return;

    updateDropdownPosition();
    setFocusedIndex(0);
    setDropdownOpen(true);
  }, [dropdownOpen, dropdownRef, hasDropdown, inactive, selectorRef, updateDropdownPosition]);

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
      onAfterSelect?.();
    },
    [onSelectCountry, closeDropdown, onAfterSelect]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setFocusedIndex(0);
  }, []);

  const scrollFocusedIntoView = useCallback(
    (index: number) => {
      setTimeout(() => scrollCountryOptionIntoView(dropdownRef.current, index));
    },
    [dropdownRef]
  );

  const handleSearchKeydown = useCallback(
    (e: React.KeyboardEvent) => {
      handleCountrySearchKeydown(
        e,
        focusedIndex,
        filteredCountries,
        setFocusedIndex,
        scrollFocusedIntoView,
        (country) => selectCountry(country.id)
      );
    },
    [filteredCountries, focusedIndex, selectCountry, scrollFocusedIntoView]
  );

  const handleSelectorPointerDown = useCallback((e: React.PointerEvent) => {
    openByKeyboardRef.current = e.pointerType === 'mouse';
  }, []);

  const handleSelectorKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      handleCountryButtonKeydown(
        e,
        dropdownOpen,
        () => {
          openByKeyboardRef.current = true;
        },
        focusSearch,
        openDropdown
      );
    },
    [dropdownOpen, openDropdown, focusSearch]
  );

  useEffect(() => {
    if ((inactive || !hasDropdown) && dropdownOpen) {
      closeDropdown();
    }
  }, [inactive, hasDropdown, dropdownOpen, closeDropdown]);

  useEffect(() => {
    if (!dropdownOpen) return;

    updateDropdownPosition();
    if (openByKeyboardRef.current) {
      focusSearch();
    }

    return bindCountryDropdownListeners(
      () => dropdownRef.current,
      () => selectorRef.current,
      closeDropdown,
      updateDropdownPosition
    );
  }, [dropdownOpen, closeDropdown, dropdownRef, selectorRef, focusSearch, updateDropdownPosition]);

  return {
    // State
    dropdownOpen,
    search,
    focusedIndex,
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
    handleSelectorPointerDown,
    handleSelectorKeydown
  };
}
