import { afterRenderEffect, computed, linkedSignal } from '@angular/core';
import { MasksFull, type CountryKey } from '@desource/phone-mask';
import {
  bindCountryDropdownListeners,
  filterCountries,
  handleCountryButtonKeydown,
  handleCountrySearchKeydown,
  positionCountryDropdown,
  scrollCountryOptionIntoView
} from '@desource/phone-mask/kit';
import type { MaybeGetter } from '../../types';
import { readOption } from '../utility/readOption';

interface UseCountrySelectorOptions {
  rootRef: () => HTMLElement | null;
  dropdownRef: () => HTMLElement | null;
  searchRef: () => HTMLInputElement | null;
  selectorRef: () => HTMLButtonElement | null;
  locale: MaybeGetter<string>;
  countryOption?: MaybeGetter<string | undefined>;
  inactive?: MaybeGetter<boolean | undefined>;
  onSelectCountry: (code: CountryKey) => void;
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
}: UseCountrySelectorOptions) {
  const countries = computed(() => MasksFull(readOption(locale)));
  const hasDropdown = computed(() => !readOption(countryOption) && countries().length > 1);
  const canOpen = computed(() => hasDropdown() && !readOption(inactive));
  const dropdownOpen = linkedSignal({ source: canOpen, computation: () => false });
  const search = linkedSignal({ source: dropdownOpen, computation: () => '' });
  const focusedIndex = linkedSignal({ source: dropdownOpen, computation: () => 0 });
  let openByKeyboard = false;

  const filteredCountries = computed(() => filterCountries(countries(), search()));
  const setFocusedIndex = (index: number | ((index: number) => number)) => {
    focusedIndex.update((current) => (typeof index === 'function' ? index(current) : index));
  };
  const updateDropdownPosition = () => positionCountryDropdown(rootRef(), dropdownRef());
  const focusSearch = () => searchRef()?.focus({ preventScroll: true });

  const closeDropdown = () => {
    dropdownOpen.set(false);
    search.set('');
    focusedIndex.set(0);
    openByKeyboard = false;
  };

  const openDropdown = () => {
    if (!canOpen() || dropdownOpen() || !dropdownRef() || !selectorRef()) return;
    focusedIndex.set(0);
    dropdownOpen.set(true);
  };

  const toggleDropdown = () => {
    if (!canOpen()) return;
    if (dropdownOpen()) closeDropdown();
    else openDropdown();
  };

  const selectCountry = (code: CountryKey) => {
    onSelectCountry(code);
    closeDropdown();
    onAfterSelect?.();
  };

  const handleSearchChange = (event: Event) => {
    search.set((event.target as HTMLInputElement).value);
    focusedIndex.set(0);
  };

  const handleSearchKeydown = (event: KeyboardEvent) => {
    handleCountrySearchKeydown(
      event,
      focusedIndex(),
      filteredCountries(),
      setFocusedIndex,
      (index) => scrollCountryOptionIntoView(dropdownRef(), index),
      (country) => selectCountry(country.id)
    );
  };

  const handleSelectorPointerDown = (event: PointerEvent) => {
    openByKeyboard = event.pointerType === 'mouse';
  };

  const handleSelectorKeydown = (event: KeyboardEvent) => {
    handleCountryButtonKeydown(event, dropdownOpen(), () => (openByKeyboard = true), focusSearch, openDropdown);
  };

  afterRenderEffect((onCleanup) => {
    if (!dropdownOpen()) return;
    updateDropdownPosition();
    if (openByKeyboard) focusSearch();
    onCleanup(bindCountryDropdownListeners(dropdownRef, selectorRef, closeDropdown, updateDropdownPosition));
  });

  return {
    dropdownOpen,
    search,
    focusedIndex,
    filteredCountries,
    hasDropdown,
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
