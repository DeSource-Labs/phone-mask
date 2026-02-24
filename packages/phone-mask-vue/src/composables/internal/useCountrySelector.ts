import { ref, computed, watch, onBeforeUnmount, shallowRef, toValue, nextTick } from 'vue';
import type { MaybeRefOrGetter, ShallowRef, CSSProperties } from 'vue';

import { MasksFull, filterCountries, type CountryKey } from '@desource/phone-mask';

import { useTimer } from '../utility/useTimer';

interface UseCountrySelectorOptions {
  rootRef: ShallowRef<HTMLDivElement | null>;
  dropdownRef: ShallowRef<HTMLDivElement | null>;
  searchRef: ShallowRef<HTMLInputElement | null>;
  selectorRef: ShallowRef<HTMLDivElement | null>;
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
  const dropdownStyle = shallowRef<CSSProperties>({});
  const focusedIndex = ref(0);

  const countries = computed(() => MasksFull(toValue(locale)));
  const filteredCountries = computed(() => filterCountries(countries.value, search.value));
  const hasDropdown = computed(() => !toValue(countryOption) && countries.value.length > 1);

  const setFocusedIndex = (index: number) => {
    focusedIndex.value = index;
  };

  const focusSearch = () => {
    nextTick(() => searchRef.value?.focus({ preventScroll: true }));
  };

  const closeDropdown = () => {
    dropdownOpen.value = false;
  };

  const openDropdown = () => {
    dropdownOpen.value = true;
    setFocusedIndex(0);
    focusSearch();
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
    search.value = '';
    setFocusedIndex(0);
    onAfterSelect?.();
  };

  const onDocClick = (ev: Event) => {
    const target = ev.target as Node | null;
    const dropdownEl = dropdownRef.value;
    const selectorEl = selectorRef.value;
    if (!target) return;
    if (dropdownEl?.contains(target)) return;
    if (selectorEl?.contains(target)) return;
    closeDropdown();
  };

  const positionDropdown = (e?: Event | UIEvent) => {
    if (e?.type === 'scroll' && e.target && dropdownRef.value?.contains(e.target as Node)) return;
    if (!rootRef.value) return;

    const rect = rootRef.value.getBoundingClientRect();

    dropdownStyle.value = {
      top: `${rect.bottom + window.scrollY + 8}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`
    };
  };

  const scrollFocusedIntoView = () => {
    nextTick(() => {
      const list = dropdownRef.value?.lastElementChild;
      const option = list?.children[focusedIndex.value];
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
    });
  };

  const handleSearchKeydown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(Math.min(focusedIndex.value + 1, filteredCountries.value.length - 1));
      scrollFocusedIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(Math.max(focusedIndex.value - 1, 0));
      scrollFocusedIntoView();
    } else if (e.key === 'Enter' && filteredCountries.value[focusedIndex.value]) {
      e.preventDefault();
      selectCountry(filteredCountries.value[focusedIndex.value]!.id);
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  };

  const removeListeners = () => {
    window.removeEventListener('resize', positionDropdown);
    window.removeEventListener('scroll', positionDropdown, true);
    window.removeEventListener('click', onDocClick, true);
  };

  watch(dropdownOpen, (isOpen) => {
    if (!isOpen) {
      removeListeners();
      return;
    }

    positionDropdown();
    window.addEventListener('resize', positionDropdown);
    window.addEventListener('scroll', positionDropdown, true);
    window.addEventListener('click', onDocClick, true);
  });

  onBeforeUnmount(removeListeners);

  return {
    // State
    dropdownOpen,
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
    handleSearchKeydown
  };
}
