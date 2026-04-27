import { ref, computed, watch, toValue, nextTick, type MaybeRefOrGetter, type ShallowRef } from 'vue';
import { MasksFull, filterCountries, type CountryKey } from '@desource/phone-mask';

type PopoverElement = HTMLDivElement & {
  showPopover(options?: { source?: HTMLElement }): void;
  hidePopover(): void;
};

interface UseCountrySelectorOptions {
  rootRef: ShallowRef<HTMLDivElement | null>;
  dropdownRef: ShallowRef<PopoverElement | null>;
  searchRef: ShallowRef<HTMLInputElement | null>;
  selectorRef: ShallowRef<HTMLButtonElement | null>;
  locale: MaybeRefOrGetter<string>;
  onSelectCountry: (code: CountryKey) => void;
  countryOption?: MaybeRefOrGetter<string | undefined>;
  inactive?: MaybeRefOrGetter<boolean | undefined>;
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
  const search = ref('');
  const dropdownOpen = ref(false);
  const focusedIndex = ref(0);
  let openByKeyboard = false;

  const countries = computed(() => MasksFull(toValue(locale)));
  const filteredCountries = computed(() => filterCountries(countries.value, search.value));
  const hasDropdown = computed(() => !toValue(countryOption) && countries.value.length > 1);

  const setFocusedIndex = (index: number) => {
    focusedIndex.value = index;
  };

  const focusSearch = () => {
    nextTick(() => searchRef.value?.focus({ preventScroll: true }));
  };

  const resetDropdownState = () => {
    search.value = '';
    setFocusedIndex(0);
    openByKeyboard = false;
  };

  const updateMaxHeight = () => {
    const rootEl = rootRef.value;
    const dropdownEl = dropdownRef.value;
    if (!rootEl || !dropdownEl) return;

    const rect = rootEl.getBoundingClientRect();
    const viewportHeight = globalThis.visualViewport?.height ?? globalThis.innerHeight;
    const searchHeight = (dropdownEl.firstElementChild as HTMLElement | null)?.offsetHeight || SEARCH_HEIGHT;
    const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_GAP - searchHeight;
    const spaceAbove = rect.top - VIEWPORT_GAP - searchHeight;
    const maxHeight = Math.min(DROPDOWN_HEIGHT, Math.max(spaceBelow, spaceAbove));

    dropdownEl.style.setProperty('--pi-dropdown-max-height', `${Math.max(0, Math.floor(maxHeight))}px`);
  };

  const closeDropdown = () => {
    if (!dropdownOpen.value) return;
    dropdownRef.value?.hidePopover();
  };

  const openDropdown = () => {
    if (toValue(inactive) || !hasDropdown.value || dropdownOpen.value) return;

    const dropdownEl = dropdownRef.value;
    const selectorEl = selectorRef.value;
    if (!dropdownEl || !selectorEl) return;

    updateMaxHeight();
    dropdownEl.showPopover({ source: selectorEl });
    setFocusedIndex(0);
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
    resetDropdownState();
    onAfterSelect?.();
  };

  const handleSearchChange = (e: Event) => {
    search.value = (e.target as HTMLInputElement).value;
    setFocusedIndex(0);
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

      if (!dropdownOpen.value) {
        openDropdown();
      } else {
        focusSearch();
      }
    }
  };

  watch(
    [dropdownRef, dropdownOpen, hasDropdown, () => toValue(inactive)],
    (_, __, onCleanup) => {
      const dropdownEl = dropdownRef.value;
      if (!dropdownEl) return;

      const handleToggle = (event: ToggleEvent) => {
        const nextState = event.newState ?? (dropdownOpen.value ? 'closed' : 'open');
        const isOpen = nextState === 'open';

        dropdownOpen.value = isOpen;

        if (isOpen) {
          if (openByKeyboard) focusSearch();
          return;
        }

        resetDropdownState();
      };

      dropdownEl.addEventListener('toggle', handleToggle);

      onCleanup(() => {
        dropdownEl.removeEventListener('toggle', handleToggle);
      });
    },
    { immediate: true }
  );

  watch([hasDropdown, () => toValue(inactive)], ([dropdownExists, isInactive]) => {
    if ((isInactive || !dropdownExists) && dropdownOpen.value) {
      closeDropdown();
    }
  });

  watch(dropdownOpen, (isOpen, _, onCleanup) => {
    if (!isOpen) return;

    globalThis.addEventListener('resize', updateMaxHeight);
    globalThis.visualViewport?.addEventListener('resize', updateMaxHeight);

    onCleanup(() => {
      globalThis.removeEventListener('resize', updateMaxHeight);
      globalThis.visualViewport?.removeEventListener('resize', updateMaxHeight);
    });
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
