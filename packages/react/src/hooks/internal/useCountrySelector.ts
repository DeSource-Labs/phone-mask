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

  const updateDropdownPosition = useCallback(() => {
    positionCountryDropdown(rootRef.current, dropdownRef.current);
  }, [dropdownRef, rootRef]);

  const focusSearch = useCallback(() => {
    setTimeout(() => searchRef.current?.focus({ preventScroll: true }));
  }, [searchRef]);

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
    setSearch('');
    setFocusedIndex(0);
    openByKeyboardRef.current = false;
  }, []);

  const openDropdown = () => {
    if (inactive || !hasDropdown || dropdownOpen || !dropdownRef.current || !selectorRef.current) return;

    updateDropdownPosition();
    setFocusedIndex(0);
    setDropdownOpen(true);
  };

  const toggleDropdown = () => {
    if (inactive || !hasDropdown) return;
    if (dropdownOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const selectCountry = useCallback(
    (code: CountryKey) => {
      onSelectCountry(code);
      closeDropdown();
      onAfterSelect?.();
    },
    [onSelectCountry, closeDropdown, onAfterSelect]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setFocusedIndex(0);
  };

  const clearSearch = () => {
    setSearch('');
    setFocusedIndex(0);
    searchRef.current?.focus({ preventScroll: true });
  };

  const handleSearchKeydown = (e: React.KeyboardEvent) => {
    handleCountrySearchKeydown(
      e,
      focusedIndex,
      filteredCountries,
      setFocusedIndex,
      (index) => setTimeout(() => scrollCountryOptionIntoView(dropdownRef.current, index)),
      (country) => selectCountry(country.id)
    );
  };

  const handleSelectorPointerDown = (e: React.PointerEvent) => {
    openByKeyboardRef.current = e.pointerType === 'mouse';
  };

  const handleSelectorKeydown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    handleCountryButtonKeydown(
      e,
      dropdownOpen,
      () => {
        openByKeyboardRef.current = true;
      },
      focusSearch,
      openDropdown
    );
  };

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
    clearSearch,
    handleSearchKeydown,
    handleSelectorPointerDown,
    handleSelectorKeydown
  };
}
