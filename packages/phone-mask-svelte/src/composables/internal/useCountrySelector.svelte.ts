import { tick } from 'svelte';
import { MasksFull, filterCountries, type CountryKey } from '@desource/phone-mask';

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

const DROPDOWN_HEIGHT = 300;
const VIEWPORT_GAP = 8;
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

  const updateDropdownPosition = () => {
    const root = rootRef();
    const dropdownEl = dropdownRef();
    if (!root || !dropdownEl) return;

    const rect = root.getBoundingClientRect();
    const viewport = globalThis.visualViewport;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportLeft = viewport?.offsetLeft ?? 0;
    const viewportHeight = viewport?.height ?? globalThis.innerHeight;
    const viewportWidth = viewport?.width ?? globalThis.innerWidth;
    const searchHeight = SEARCH_HEIGHT;
    const spaceBelow = viewportTop + viewportHeight - rect.bottom - VIEWPORT_GAP - searchHeight;
    const spaceAbove = rect.top - viewportTop - VIEWPORT_GAP - searchHeight;
    const maxHeight = Math.min(DROPDOWN_HEIGHT, Math.max(spaceBelow, spaceAbove));
    const opensAbove = spaceAbove > spaceBelow && spaceBelow < DROPDOWN_HEIGHT;
    const width = Math.floor(rect.width);
    const left = Math.max(
      viewportLeft + VIEWPORT_GAP,
      Math.min(rect.left, viewportLeft + viewportWidth - width - VIEWPORT_GAP)
    );
    const top = opensAbove
      ? Math.max(
          viewportTop + VIEWPORT_GAP,
          rect.top - Math.max(0, Math.floor(maxHeight)) - searchHeight - VIEWPORT_GAP
        )
      : rect.bottom + VIEWPORT_GAP;

    dropdownEl.style.setProperty('--pi-dropdown-top', `${Math.floor(top)}px`);
    dropdownEl.style.setProperty('--pi-dropdown-left', `${Math.floor(left)}px`);
    dropdownEl.style.setProperty('--pi-dropdown-width', `${width}px`);
    dropdownEl.style.setProperty('--pi-dropdown-max-height', `${Math.max(0, Math.floor(maxHeight))}px`);
    dropdownEl.dataset.placement = opensAbove ? 'top' : 'bottom';
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

      if (dropdownOpen) {
        focusSearch();
      } else {
        openDropdown();
      }
    }
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

    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      const dropdownEl = dropdownRef();
      const selectorEl = selectorRef();
      if (target instanceof Node && (dropdownEl?.contains(target) || selectorEl?.contains(target))) return;
      closeDropdown();
    };
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDropdown();
    };
    const handleScroll = (event: Event) => {
      if (event.target instanceof Node && dropdownRef()?.contains(event.target)) return;
      updateDropdownPosition();
    };

    globalThis.addEventListener('pointerdown', handleOutsidePointer, true);
    globalThis.addEventListener('keydown', handleKeydown);
    globalThis.addEventListener('resize', updateDropdownPosition);
    globalThis.addEventListener('scroll', handleScroll, true);
    globalThis.visualViewport?.addEventListener('resize', updateDropdownPosition);
    globalThis.visualViewport?.addEventListener('scroll', updateDropdownPosition);

    return () => {
      globalThis.removeEventListener('pointerdown', handleOutsidePointer, true);
      globalThis.removeEventListener('keydown', handleKeydown);
      globalThis.removeEventListener('resize', updateDropdownPosition);
      globalThis.removeEventListener('scroll', handleScroll, true);
      globalThis.visualViewport?.removeEventListener('resize', updateDropdownPosition);
      globalThis.visualViewport?.removeEventListener('scroll', updateDropdownPosition);
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
