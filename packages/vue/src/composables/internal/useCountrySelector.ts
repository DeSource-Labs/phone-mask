import { ref, computed, watch, toValue, nextTick, type MaybeRefOrGetter, type ShallowRef } from 'vue';
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
  rootRef: ShallowRef<HTMLDivElement | null>;
  dropdownRef: ShallowRef<HTMLDivElement | null>;
  searchRef: ShallowRef<HTMLInputElement | null>;
  selectorRef: ShallowRef<HTMLButtonElement | null>;
  locale: MaybeRefOrGetter<string>;
  onSelectCountry: (code: CountryKey) => void;
  countryOption?: MaybeRefOrGetter<string | undefined>;
  inactive?: MaybeRefOrGetter<boolean | undefined>;
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
  const search = ref('');
  const dropdownOpen = ref(false);
  const focusedIndex = ref(0);
  let openByKeyboard = false;

  const countries = computed(() => MasksFull(toValue(locale)));
  const filteredCountries = computed(() => filterCountries(countries.value, search.value));
  const hasDropdown = computed(() => !toValue(countryOption) && countries.value.length > 1);

  const setFocusedIndex = (index: number | ((index: number) => number)) => {
    focusedIndex.value = typeof index === 'function' ? index(focusedIndex.value) : index;
  };

  const focusSearch = () => {
    nextTick(() => searchRef.value?.focus({ preventScroll: true }));
  };

  const resetDropdownState = () => {
    search.value = '';
    setFocusedIndex(0);
    openByKeyboard = false;
  };

  const updateDropdownPosition = () => {
    positionCountryDropdown(rootRef.value, dropdownRef.value);
  };

  const closeDropdown = () => {
    dropdownOpen.value = false;
    resetDropdownState();
  };

  const openDropdown = () => {
    if (toValue(inactive) || !hasDropdown.value || dropdownOpen.value) return;

    const dropdownEl = dropdownRef.value;
    const selectorEl = selectorRef.value;
    if (!dropdownEl || !selectorEl) return;

    updateDropdownPosition();
    setFocusedIndex(0);
    dropdownOpen.value = true;
  };

  const toggleDropdown = () => {
    if (toValue(inactive) || !hasDropdown.value) return;
    if (dropdownOpen.value) {
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
    search.value = (e.target as HTMLInputElement).value;
    setFocusedIndex(0);
  };

  const scrollFocusedIntoView = (index: number) => {
    nextTick(() => scrollCountryOptionIntoView(dropdownRef.value, index));
  };

  const handleSearchKeydown = (e: KeyboardEvent) => {
    handleCountrySearchKeydown(
      e,
      focusedIndex.value,
      filteredCountries.value,
      setFocusedIndex,
      scrollFocusedIntoView,
      (country) => selectCountry(country.id)
    );
  };

  const handleSelectorPointerDown = (e: PointerEvent) => {
    openByKeyboard = e.pointerType === 'mouse';
  };

  const handleSelectorKeydown = (e: KeyboardEvent) => {
    handleCountryButtonKeydown(
      e,
      dropdownOpen.value,
      () => {
        openByKeyboard = true;
      },
      focusSearch,
      openDropdown
    );
  };

  watch([hasDropdown, () => toValue(inactive)], ([dropdownExists, isInactive]) => {
    if ((isInactive || !dropdownExists) && dropdownOpen.value) {
      closeDropdown();
    }
  });

  watch(dropdownOpen, (isOpen, _, onCleanup) => {
    if (!isOpen) return;

    updateDropdownPosition();
    if (openByKeyboard) focusSearch();

    onCleanup(
      bindCountryDropdownListeners(
        () => dropdownRef.value,
        () => selectorRef.value,
        closeDropdown,
        updateDropdownPosition
      )
    );
  });

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
