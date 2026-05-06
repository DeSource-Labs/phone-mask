import { ref, computed, watch, toValue, nextTick, type MaybeRefOrGetter, type ShallowRef } from 'vue';
import { MasksFull, filterCountries, type CountryKey } from '@desource/phone-mask';

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

  const updateDropdownPosition = () => {
    const rootEl = rootRef.value;
    const dropdownEl = dropdownRef.value;
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

      if (dropdownOpen.value) {
        focusSearch();
      } else {
        openDropdown();
      }
    }
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

    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      const dropdownEl = dropdownRef.value;
      const selectorEl = selectorRef.value;
      if (target instanceof Node && (dropdownEl?.contains(target) || selectorEl?.contains(target))) return;
      closeDropdown();
    };
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDropdown();
    };
    const handleScroll = (event: Event) => {
      if (event.target instanceof Node && dropdownRef.value?.contains(event.target)) return;
      updateDropdownPosition();
    };

    globalThis.addEventListener('pointerdown', handleOutsidePointer, true);
    globalThis.addEventListener('keydown', handleKeydown);
    globalThis.addEventListener('resize', updateDropdownPosition);
    globalThis.addEventListener('scroll', handleScroll, true);
    globalThis.visualViewport?.addEventListener('resize', updateDropdownPosition);
    globalThis.visualViewport?.addEventListener('scroll', updateDropdownPosition);

    onCleanup(() => {
      globalThis.removeEventListener('pointerdown', handleOutsidePointer, true);
      globalThis.removeEventListener('keydown', handleKeydown);
      globalThis.removeEventListener('resize', updateDropdownPosition);
      globalThis.removeEventListener('scroll', handleScroll, true);
      globalThis.visualViewport?.removeEventListener('resize', updateDropdownPosition);
      globalThis.visualViewport?.removeEventListener('scroll', updateDropdownPosition);
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
