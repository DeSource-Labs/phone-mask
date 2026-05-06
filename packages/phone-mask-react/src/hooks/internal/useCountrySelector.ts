import React, { useState, useCallback, useMemo, useEffect, useRef, type RefObject } from 'react';

import { MasksFull, filterCountries, type CountryKey } from '@desource/phone-mask';

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
    const rootEl = rootRef.current;
    const dropdownEl = dropdownRef.current;
    if (!rootEl || !dropdownEl) return;

    const rect = rootEl.getBoundingClientRect();
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
  }, [dropdownRef, rootRef]);

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
    resetDropdownState();
  }, [resetDropdownState]);

  const openDropdown = useCallback(() => {
    if (inactive || !hasDropdown || dropdownOpen) return;

    const dropdownEl = dropdownRef.current;
    const selectorEl = selectorRef.current;
    if (!dropdownEl || !selectorEl) return;

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
      } else if (e.key === 'Escape') {
        closeDropdown();
      }
    },
    [filteredCountries, focusedIndex, selectCountry, closeDropdown, scrollFocusedIntoView]
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

        if (dropdownOpen) {
          setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 0);
        } else {
          openDropdown();
        }
      }
    },
    [dropdownOpen, openDropdown, searchRef]
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
      setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 0);
    }

    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      const dropdownEl = dropdownRef.current;
      const selectorEl = selectorRef.current;
      if (target instanceof Node && (dropdownEl?.contains(target) || selectorEl?.contains(target))) return;
      closeDropdown();
    };
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDropdown();
    };
    const handleScroll = (event: Event) => {
      if (event.target instanceof Node && dropdownRef.current?.contains(event.target)) return;
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
  }, [dropdownOpen, closeDropdown, dropdownRef, selectorRef, searchRef, updateDropdownPosition]);

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
