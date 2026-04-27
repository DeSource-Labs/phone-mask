import React, { useState, useCallback, useMemo, useEffect, useRef, type RefObject } from 'react';

import { MasksFull, filterCountries, type CountryKey } from '@desource/phone-mask';

type PopoverElement = HTMLDivElement & {
  showPopover(options?: { source?: HTMLElement }): void;
  hidePopover(): void;
};

interface UseCountrySelectOptions {
  rootRef: RefObject<HTMLDivElement | null>;
  dropdownRef: RefObject<PopoverElement | null>;
  searchRef: RefObject<HTMLInputElement | null>;
  selectorRef: RefObject<HTMLButtonElement | null>;
  locale: string;
  onSelectCountry: (code: CountryKey) => void;
  countryOption?: string;
  inactive?: boolean;
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

  const updateMaxHeight = useCallback(() => {
    const rootEl = rootRef.current;
    const dropdownEl = dropdownRef.current;
    if (!rootEl || !dropdownEl) return;

    const rect = rootEl.getBoundingClientRect();
    const viewportHeight = globalThis.visualViewport?.height ?? globalThis.innerHeight;
    const searchHeight = (dropdownEl.firstElementChild as HTMLElement | null)?.offsetHeight || SEARCH_HEIGHT;
    const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_GAP - searchHeight;
    const spaceAbove = rect.top - VIEWPORT_GAP - searchHeight;
    const maxHeight = Math.min(DROPDOWN_HEIGHT, Math.max(spaceBelow, spaceAbove));

    dropdownEl.style.setProperty('--pi-dropdown-max-height', `${Math.max(0, Math.floor(maxHeight))}px`);
  }, [dropdownRef, rootRef]);

  const closeDropdown = useCallback(() => {
    if (!dropdownOpen) return;

    dropdownRef.current?.hidePopover();
  }, [dropdownOpen, dropdownRef]);

  const openDropdown = useCallback(() => {
    if (inactive || !hasDropdown || dropdownOpen) return;

    const dropdownEl = dropdownRef.current;
    const selectorEl = selectorRef.current;
    if (!dropdownEl || !selectorEl) return;

    updateMaxHeight();
    dropdownEl.showPopover({ source: selectorEl });
    setFocusedIndex(0);
  }, [dropdownOpen, dropdownRef, hasDropdown, inactive, selectorRef, updateMaxHeight]);

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
      resetDropdownState();
      onAfterSelect?.();
    },
    [onSelectCountry, closeDropdown, onAfterSelect, resetDropdownState]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setFocusedIndex(0);
  }, []);

  const scrollFocusedIntoView = useCallback(
    (index: number) => {
      setTimeout(() => {
        const list = dropdownRef.current?.querySelector('.pi-options');
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
    },
    [dropdownRef]
  );

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
      }
    },
    [filteredCountries, focusedIndex, selectCountry, scrollFocusedIntoView]
  );

  const handleSelectorPointerDown = useCallback((e: React.PointerEvent) => {
    openByKeyboardRef.current = e.pointerType === 'mouse';
  }, []);

  const handleSelectorKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        openByKeyboardRef.current = true;
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        openByKeyboardRef.current = true;

        if (!dropdownOpen) {
          openDropdown();
        } else {
          setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 0);
        }
      }
    },
    [dropdownOpen, openDropdown, searchRef]
  );

  useEffect(() => {
    const dropdownEl = dropdownRef.current;
    if (!dropdownEl) return;

    const handleToggle = (event: ToggleEvent) => {
      const nextState = event.newState ?? (dropdownOpen ? 'closed' : 'open');
      const isOpen = nextState === 'open';

      setDropdownOpen(isOpen);

      if (isOpen) {
        if (openByKeyboardRef.current) {
          setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 0);
        }
        return;
      }

      resetDropdownState();
    };

    dropdownEl.addEventListener('toggle', handleToggle);

    return () => {
      dropdownEl.removeEventListener('toggle', handleToggle);
    };
  }, [dropdownOpen, dropdownRef, hasDropdown, inactive, resetDropdownState, searchRef]);

  useEffect(() => {
    if ((inactive || !hasDropdown) && dropdownOpen) {
      closeDropdown();
    }
  }, [inactive, hasDropdown, dropdownOpen, closeDropdown]);

  useEffect(() => {
    if (!dropdownOpen) return;

    globalThis.addEventListener('resize', updateMaxHeight);
    globalThis.visualViewport?.addEventListener('resize', updateMaxHeight);

    return () => {
      globalThis.removeEventListener('resize', updateMaxHeight);
      globalThis.visualViewport?.removeEventListener('resize', updateMaxHeight);
    };
  }, [dropdownOpen, updateMaxHeight]);

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
