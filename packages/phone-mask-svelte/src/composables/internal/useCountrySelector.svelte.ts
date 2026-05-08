import { tick } from 'svelte';
import { MasksFull, type CountryKey } from '@desource/phone-mask';
import {
  bindCountryDropdownListeners,
  filterCountries,
  handleCountryButtonKeydown,
  handleCountrySearchKeydown,
  positionCountryDropdown,
  scrollCountryOptionIntoView
} from '@desource/phone-mask/kit';

interface UseCountrySelectorOptions {
  rootRef: () => HTMLDivElement | null;
  dropdownRef: () => HTMLDivElement | null;
  searchRef: () => HTMLInputElement | null;
  selectorRef: () => HTMLButtonElement | null;
  locale: () => string;
  onSelectCountry: (code: CountryKey) => void;
  countryOption?: () => string | undefined;
  inactive?: () => boolean | undefined;
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
  let search = $state('');
  let dropdownOpen = $state(false);
  let focusedIndex = $state(0);
  let openByKeyboard = false;

  const countries = $derived(MasksFull(locale()));
  const filteredCountries = $derived(filterCountries(countries, search));
  const hasDropdown = $derived(!countryOption?.() && countries.length > 1);

  const setFocusedIndex = (index: number | ((index: number) => number)) => {
    focusedIndex = typeof index === 'function' ? index(focusedIndex) : index;
  };

  const focusSearch = () => {
    tick().then(() => searchRef()?.focus({ preventScroll: true }));
  };

  const resetDropdownState = () => {
    search = '';
    setFocusedIndex(0);
    openByKeyboard = false;
  };

  const updateDropdownPosition = () => {
    positionCountryDropdown(rootRef(), dropdownRef());
  };

  const closeDropdown = () => {
    dropdownOpen = false;
    resetDropdownState();
  };

  const openDropdown = () => {
    if (inactive?.() || !hasDropdown || dropdownOpen) return;

    const dropdownEl = dropdownRef();
    const selectorEl = selectorRef();
    if (!dropdownEl || !selectorEl) return;

    updateDropdownPosition();
    setFocusedIndex(0);
    dropdownOpen = true;
  };

  const toggleDropdown = () => {
    if (inactive?.() || !hasDropdown) return;
    if (dropdownOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const selectCountry = (code: CountryKey) => {
    onSelectCountry(code);
    closeDropdown();
    onAfterSelect?.();
  };

  const handleSearchChange = (e: Event) => {
    search = (e.target as HTMLInputElement).value;
    setFocusedIndex(0);
  };

  const scrollFocusedIntoView = (index: number) => {
    tick().then(() => scrollCountryOptionIntoView(dropdownRef(), index));
  };

  const handleSearchKeydown = (e: KeyboardEvent) => {
    handleCountrySearchKeydown(e, focusedIndex, filteredCountries, setFocusedIndex, scrollFocusedIntoView, (country) =>
      selectCountry(country.id)
    );
  };

  const handleSelectorPointerDown = (e: PointerEvent) => {
    openByKeyboard = e.pointerType === 'mouse';
  };

  const handleSelectorKeydown = (e: KeyboardEvent) => {
    handleCountryButtonKeydown(
      e,
      dropdownOpen,
      () => {
        openByKeyboard = true;
      },
      focusSearch,
      openDropdown
    );
  };

  $effect(() => {
    if ((inactive?.() || !hasDropdown) && dropdownOpen) {
      closeDropdown();
    }
  });

  $effect(() => {
    if (!dropdownOpen) return;

    updateDropdownPosition();
    if (openByKeyboard) focusSearch();

    return bindCountryDropdownListeners(
      () => dropdownRef(),
      () => selectorRef(),
      closeDropdown,
      updateDropdownPosition
    );
  });

  return {
    get dropdownOpen() {
      return dropdownOpen;
    },
    get search() {
      return search;
    },
    get focusedIndex() {
      return focusedIndex;
    },
    get filteredCountries() {
      return filteredCountries;
    },
    get hasDropdown() {
      return hasDropdown;
    },
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
