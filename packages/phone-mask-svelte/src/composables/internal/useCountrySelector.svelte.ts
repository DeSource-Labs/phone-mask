import { onDestroy, tick } from 'svelte';
import { MasksFull, filterCountries, type CountryKey } from '@desource/phone-mask';

interface UseCountrySelectorOptions {
  rootRef: () => HTMLDivElement | null;
  dropdownRef: () => HTMLDivElement | null;
  searchRef: () => HTMLInputElement | null;
  selectorRef: () => HTMLDivElement | null;
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
  let isClosing = $state(false);
  let dropdownStyle = $state<Record<string, string>>({});
  let focusedIndex = $state(0);

  const countries = $derived(MasksFull(locale()));
  const filteredCountries = $derived(filterCountries(countries, search));
  const hasDropdown = $derived(!countryOption?.() && countries.length > 1);

  const setFocusedIndex = (index: number) => {
    focusedIndex = index;
  };

  const focusSearch = () => {
    tick().then(() => searchRef()?.focus({ preventScroll: true }));
  };

  const closeDropdown = () => {
    if (!dropdownOpen) return;
    isClosing = true;
  };

  const openDropdown = () => {
    isClosing = false;
    dropdownOpen = true;
    setFocusedIndex(0);
    focusSearch();
  };

  const handleDropdownAnimationEnd = () => {
    if (!isClosing) return;
    dropdownOpen = false;
    isClosing = false;
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
    search = '';
    setFocusedIndex(0);
    onAfterSelect?.();
  };

  const handleSearchChange = (e: Event) => {
    search = (e.target as HTMLInputElement).value;
    setFocusedIndex(0);
  };

  const onDocClick = (ev: Event) => {
    const target = ev.target as Node | null;
    const dropdownEl = dropdownRef();
    const selectorEl = selectorRef();
    if (!target) return;
    if (dropdownEl?.contains(target)) return;
    if (selectorEl?.contains(target)) return;
    closeDropdown();
  };

  const positionDropdown = (e?: Event | UIEvent) => {
    if (e?.type === 'scroll' && e.target && dropdownRef()?.contains(e.target as Node)) return;
    const root = rootRef();
    if (!root) return;

    const rect = root.getBoundingClientRect();
    dropdownStyle = {
      top: `${rect.bottom + globalThis.scrollY + 8}px`,
      left: `${rect.left + globalThis.scrollX}px`,
      width: `${rect.width}px`
    };
  };

  const scrollFocusedIntoView = () => {
    tick().then(() => {
      const list = dropdownRef()?.lastElementChild;
      const option = list?.children[focusedIndex];
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
      setFocusedIndex(Math.min(focusedIndex + 1, filteredCountries.length - 1));
      scrollFocusedIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(Math.max(focusedIndex - 1, 0));
      scrollFocusedIntoView();
    } else if (e.key === 'Enter' && filteredCountries[focusedIndex]) {
      e.preventDefault();
      selectCountry(filteredCountries[focusedIndex]!.id);
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  };

  const removeListeners = () => {
    globalThis.removeEventListener('resize', positionDropdown);
    globalThis.removeEventListener('scroll', positionDropdown, true);
    globalThis.removeEventListener('click', onDocClick, true);
  };

  // Close dropdown when hasDropdown becomes false
  $effect(() => {
    if (!hasDropdown && dropdownOpen) {
      closeDropdown();
    }
  });

  // Manage global listeners based on dropdownOpen state
  $effect(() => {
    if (!dropdownOpen) {
      removeListeners();
      return;
    }
    positionDropdown();
    globalThis.addEventListener('resize', positionDropdown);
    globalThis.addEventListener('scroll', positionDropdown, true);
    globalThis.addEventListener('click', onDocClick, true);
  });

  onDestroy(removeListeners);

  return {
    get dropdownOpen() {
      return dropdownOpen;
    },
    get isClosing() {
      return isClosing;
    },
    get search() {
      return search;
    },
    get focusedIndex() {
      return focusedIndex;
    },
    get dropdownStyle() {
      return dropdownStyle;
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
    handleDropdownAnimationEnd
  };
}
