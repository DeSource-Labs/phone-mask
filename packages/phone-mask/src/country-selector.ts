type KeyLikeEvent = {
  key: string;
  preventDefault: () => void;
};

type PointerLikeEvent = {
  pointerType: string;
};

type ElementGetter = () => Node | null | undefined;
type FocusedIndexUpdate = number | ((index: number) => number);
type VoidCallback = () => void;

const DROPDOWN_HEIGHT = 300;
const VIEWPORT_GAP = 8;
const SEARCH_HEIGHT = 56;
function containsEventTarget(container: Node | null | undefined, target: EventTarget | null): boolean {
  return !!container && target instanceof Node && container.contains(target);
}

export function positionCountryDropdown(rootEl: Element | null, dropdownEl: HTMLElement | null): void {
  if (!rootEl || !dropdownEl) return;

  const rect = rootEl.getBoundingClientRect();
  const viewport = globalThis.visualViewport;
  const viewportTop = viewport?.offsetTop ?? 0;
  const viewportLeft = viewport?.offsetLeft ?? 0;
  const viewportHeight = viewport?.height ?? globalThis.innerHeight;
  const viewportWidth = viewport?.width ?? globalThis.innerWidth;
  const spaceBelow = Math.max(0, viewportTop + viewportHeight - rect.bottom - VIEWPORT_GAP * 2 - SEARCH_HEIGHT);
  const spaceAbove = Math.max(0, rect.top - viewportTop - VIEWPORT_GAP * 2 - SEARCH_HEIGHT);
  const maxHeight = Math.min(DROPDOWN_HEIGHT, Math.max(spaceBelow, spaceAbove));
  const opensAbove = spaceAbove > spaceBelow && spaceBelow < DROPDOWN_HEIGHT;
  const width = Math.min(Math.floor(rect.width), Math.max(0, Math.floor(viewportWidth - VIEWPORT_GAP * 2)));
  const left = Math.max(
    viewportLeft + VIEWPORT_GAP,
    Math.min(rect.left, viewportLeft + viewportWidth - width - VIEWPORT_GAP)
  );
  const top = opensAbove
    ? Math.max(viewportTop + VIEWPORT_GAP, rect.top - Math.max(0, Math.floor(maxHeight)) - SEARCH_HEIGHT - VIEWPORT_GAP)
    : rect.bottom + VIEWPORT_GAP;

  dropdownEl.style.setProperty('--pi-dd-top', `${Math.floor(top)}px`);
  dropdownEl.style.setProperty('--pi-dd-left', `${Math.floor(left)}px`);
  dropdownEl.style.setProperty('--pi-dd-width', `${width}px`);
  dropdownEl.style.setProperty('--pi-dd-max-height', `${Math.max(0, Math.floor(maxHeight))}px`);
  dropdownEl.dataset.placement = opensAbove ? 'top' : 'bottom';
}

export function scrollCountryOptionIntoView(dropdownEl: Element | null | undefined, index: number): void {
  dropdownEl?.querySelector('.pi-options')?.children[index]?.scrollIntoView?.({ block: 'nearest' });
}

export function bindCountryDropdownListeners(
  getDropdownElement: ElementGetter,
  getSelectorElement: ElementGetter,
  closeDropdown: VoidCallback,
  updateDropdownPosition: VoidCallback
): VoidCallback {
  const handleOutsidePointer = (event: PointerEvent) => {
    const target = event.target;
    if (containsEventTarget(getDropdownElement(), target) || containsEventTarget(getSelectorElement(), target)) return;
    closeDropdown();
  };
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeDropdown();
  };
  const handleScroll = (event: Event) => {
    if (containsEventTarget(getDropdownElement(), event.target)) return;
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
}

export function handleCountrySearchKeydown<T>(
  event: KeyLikeEvent,
  focusedIndex: number,
  items: readonly T[],
  setFocusedIndex: (index: FocusedIndexUpdate) => void,
  scrollFocusedIntoView: (index: number) => void,
  selectItem: (item: T) => void,
  closeDropdown: VoidCallback
): void {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setFocusedIndex((index) => {
      const next = Math.min(index + 1, items.length - 1);
      scrollFocusedIntoView(next);
      return next;
    });
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    setFocusedIndex((index) => {
      const prev = Math.max(index - 1, 0);
      scrollFocusedIntoView(prev);
      return prev;
    });
  } else if (event.key === 'Enter' && items[focusedIndex]) {
    event.preventDefault();
    selectItem(items[focusedIndex]!);
  } else if (event.key === 'Escape') {
    closeDropdown();
  }
}

export function isMousePointer(event: PointerLikeEvent): boolean {
  return event.pointerType === 'mouse';
}

export function handleCountryButtonKeydown(
  event: KeyLikeEvent,
  dropdownOpen: boolean,
  setOpenByKeyboard: VoidCallback,
  focusSearch: VoidCallback,
  openDropdown: VoidCallback
): void {
  if (event.key === 'Enter' || event.key === ' ') {
    setOpenByKeyboard();
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setOpenByKeyboard();

    if (dropdownOpen) {
      focusSearch();
    } else {
      openDropdown();
    }
  }
}
