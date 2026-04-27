import { tick } from 'svelte';
import { MasksFull, filterCountries, type CountryKey } from '@desource/phone-mask';

type PopoverElement = HTMLDivElement & {
  showPopover(options?: { source?: HTMLElement }): void;
  hidePopover(): void;
};

interface UseCountrySelectorOptions {
  rootRef: () => HTMLDivElement | null;
  dropdownRef: () => PopoverElement | null;
  searchRef: () => HTMLInputElement | null;
  selectorRef: () => HTMLButtonElement | null;
  locale: () => string;
  onSelectCountry: (code: CountryKey) => void;
  countryOption?: () => string | undefined;
  inactive?: () => boolean | undefined;
  onAfterSelect?: () => void;
}

const DROPDOWN_HEIGHT = 300;
const VIEWPORT_GAP = 16;
const SEARCH_HEIGHT = 56;

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

  const setFocusedIndex = (index: number) => {
    focusedIndex = index;
  };

  const focusSearch = () => {
    tick().then(() => searchRef()?.focus({ preventScroll: true }));
  };

  const resetDropdownState = () => {
    search = '';
    setFocusedIndex(0);
    openByKeyboard = false;
  };

  const updateMaxHeight = () => {
    const root = rootRef();
    const dropdownEl = dropdownRef();
    if (!root || !dropdownEl) return;

    const rect = root.getBoundingClientRect();
    const viewportHeight = globalThis.visualViewport?.height ?? globalThis.innerHeight;
    const searchHeight = (dropdownEl.firstElementChild as HTMLElement | null)?.offsetHeight || SEARCH_HEIGHT;
    const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_GAP - searchHeight;
    const spaceAbove = rect.top - VIEWPORT_GAP - searchHeight;
    const maxHeight = Math.min(DROPDOWN_HEIGHT, Math.max(spaceBelow, spaceAbove));

    dropdownEl.style.setProperty('--pi-dropdown-max-height', `${Math.max(0, Math.floor(maxHeight))}px`);
  };

  const closeDropdown = () => {
    if (!dropdownOpen) return;
    dropdownRef()?.hidePopover();
  };

  const openDropdown = () => {
    if (inactive?.() || !hasDropdown || dropdownOpen) return;

    const dropdownEl = dropdownRef();
    const selectorEl = selectorRef();
    if (!dropdownEl || !selectorEl) return;

    updateMaxHeight();
    dropdownEl.showPopover({ source: selectorEl });
    setFocusedIndex(0);
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
    resetDropdownState();
    onAfterSelect?.();
  };

  const handleSearchChange = (e: Event) => {
    search = (e.target as HTMLInputElement).value;
    setFocusedIndex(0);
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
    }
  };

  const handleSelectorPointerDown = (e: PointerEvent) => {
    openByKeyboard = e.pointerType === 'mouse';
  };

  const handleSelectorKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      openByKeyboard = true;
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      openByKeyboard = true;

      if (!dropdownOpen) {
        openDropdown();
      } else {
        focusSearch();
      }
    }
  };

  $effect(() => {
    const dropdownEl = dropdownRef();
    if (!dropdownEl) return;

    const handleToggle = (event: ToggleEvent) => {
      const nextState = event.newState ?? (dropdownOpen ? 'closed' : 'open');
      const isOpen = nextState === 'open';

      dropdownOpen = isOpen;

      if (isOpen) {
        if (openByKeyboard) focusSearch();
        return;
      }

      resetDropdownState();
    };

    dropdownEl.addEventListener('toggle', handleToggle);

    return () => {
      dropdownEl.removeEventListener('toggle', handleToggle);
    };
  });

  $effect(() => {
    if ((inactive?.() || !hasDropdown) && dropdownOpen) {
      closeDropdown();
    }
  });

  $effect(() => {
    if (!dropdownOpen) return;

    globalThis.addEventListener('resize', updateMaxHeight);
    globalThis.visualViewport?.addEventListener('resize', updateMaxHeight);

    return () => {
      globalThis.removeEventListener('resize', updateMaxHeight);
      globalThis.visualViewport?.removeEventListener('resize', updateMaxHeight);
    };
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
