/// <reference types="vitest/globals" />
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCountrySelector } from '@src/hooks/internal/useCountrySelector';
import { testUseCountrySelector, type SetupOptions } from '@common/tests/unit/useCountrySelector';
import { tools, renderHookWithProxy } from './setup/tools';
import { createRect } from '@common/tests/unit/setup/domRect';

type CountrySelectorResult = ReturnType<typeof useCountrySelector>;

function attachLightDismiss(dropdownEl: HTMLDivElement, selectorEl: HTMLButtonElement) {
  const onWindowClick = (event: Event) => {
    if (!dropdownEl.hasAttribute('data-popover-open')) return;

    const target = event.target;
    if (target instanceof Node && (dropdownEl.contains(target) || selectorEl.contains(target))) return;

    dropdownEl.hidePopover();
  };

  globalThis.addEventListener('click', onWindowClick, true);

  return () => {
    globalThis.removeEventListener('click', onWindowClick, true);
  };
}

function setup(options: SetupOptions = {}) {
  const { countryOption, inactive } = options;

  const rootEl = document.createElement('div');
  const rootRef = { current: rootEl };
  const dropdownEl = document.createElement('div');
  const dropdownRef = { current: dropdownEl };
  const selectorEl = document.createElement('button');
  const selectorRef = { current: selectorEl };

  const searchEl = document.createElement('input');
  const searchRef = { current: searchEl };
  vi.spyOn(searchEl, 'focus').mockImplementation(() => {});

  const onSelectCountry = vi.fn();
  const onAfterSelect = vi.fn();

  document.body.append(rootEl, dropdownEl, selectorEl);
  const cleanupLightDismiss = attachLightDismiss(dropdownEl, selectorEl);

  const hook = renderHookWithProxy(() =>
    useCountrySelector({
      rootRef,
      dropdownRef,
      searchRef,
      selectorRef,
      locale: 'en',
      onSelectCountry,
      onAfterSelect,
      countryOption,
      inactive
    })
  );

  const result = new Proxy(hook.result as CountrySelectorResult, {
    get(target, key, receiver) {
      if (key === 'openDropdown') {
        return () => {
          target.handleSelectorKeydown({ key: 'Enter' } as never);
          target.openDropdown();
        };
      }

      return Reflect.get(target, key, receiver);
    }
  });

  return {
    result,
    simulateCloseComplete: () => {},
    unmount: () => {
      cleanupLightDismiss();
      rootEl.remove();
      dropdownEl.remove();
      selectorEl.remove();
      hook.unmount();
    },
    onSelectCountry,
    onAfterSelect,
    searchEl
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

testUseCountrySelector(setup, tools);

function setupWithDom(initialCountryOption?: string, initialInactive = false) {
  const rootEl = document.createElement('div');
  const rootRectSpy = vi.spyOn(rootEl, 'getBoundingClientRect').mockReturnValue(createRect(10, 30, 5, 120));
  const rootRef: { current: HTMLDivElement | null } = { current: rootEl };
  const dropdownEl = document.createElement('div');
  const dropdownRef = { current: dropdownEl };
  const list = document.createElement('ul');
  list.className = 'pi-options';
  const optionA = document.createElement('li');
  const optionB = document.createElement('li');
  list.append(optionA, optionB);
  dropdownEl.append(document.createElement('div'), list);

  const listRectSpy = vi.spyOn(list, 'getBoundingClientRect').mockReturnValue(createRect(0, 20));
  const optionARectSpy = vi.spyOn(optionA, 'getBoundingClientRect').mockReturnValue(createRect(0, 10));
  const optionBRectSpy = vi.spyOn(optionB, 'getBoundingClientRect').mockReturnValue(createRect(24, 44));

  const scrollToSpy = vi.fn();
  Object.defineProperty(list, 'scrollTo', {
    value: scrollToSpy,
    configurable: true
  });

  const searchEl = document.createElement('input');
  const searchFocusSpy = vi.spyOn(searchEl, 'focus').mockImplementation(() => {});
  const searchRef = { current: searchEl };
  const selectorEl = document.createElement('button');
  const selectorRef = { current: selectorEl };
  const onSelectCountry = vi.fn();

  document.body.append(rootEl, dropdownEl, selectorEl);
  const cleanupLightDismiss = attachLightDismiss(dropdownEl, selectorEl);

  const { result, rerender, unmount } = renderHookWithProxy(
    ({ countryOption, inactive }: { countryOption?: string; inactive?: boolean }) =>
      useCountrySelector({
        rootRef,
        dropdownRef,
        searchRef,
        selectorRef,
        locale: 'en',
        countryOption,
        inactive,
        onSelectCountry
      }),
    { initialProps: { countryOption: initialCountryOption, inactive: initialInactive } }
  );

  return {
    result,
    rerender,
    unmount: () => {
      cleanupLightDismiss();
      rootEl.remove();
      dropdownEl.remove();
      selectorEl.remove();
      unmount();
    },
    scrollToSpy,
    listRectSpy,
    optionARectSpy,
    optionBRectSpy,
    rootRectSpy,
    searchFocusSpy,
    searchEl,
    list,
    rootRef,
    dropdownTarget: dropdownEl,
    selectorTarget: selectorEl,
    flushAsync: async () => {
      vi.runAllTimers();
    },
    setCountryOptionFixed: () => {
      rerender({ countryOption: 'US', inactive: initialInactive });
    },
    setInactive: () => {
      rerender({ countryOption: initialCountryOption, inactive: true });
    },
    setRootUnavailable: () => {
      rootRef.current = null;
      globalThis.dispatchEvent(new Event('resize'));
    },
    setDropdownUnavailable: () => {
      dropdownRef.current = null;
    },
    setSelectorUnavailable: () => {
      selectorRef.current = null;
    }
  };
}

describe('useCountrySelector DOM behavior (React)', () => {
  let originalInnerHeight = globalThis.innerHeight;

  beforeEach(() => {
    vi.useFakeTimers();
    originalInnerHeight = globalThis.innerHeight;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'innerHeight', {
      value: originalInnerHeight,
      configurable: true
    });
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('scrolls focused option into view when navigating down', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.openDropdown();
    });

    await tools.act(async () => {
      ctx.result.handleSearchKeydown({ key: 'ArrowDown', preventDefault: vi.fn() });
    });
    await ctx.flushAsync();

    expect(ctx.scrollToSpy).toHaveBeenCalledWith({ top: 24, behavior: 'smooth' });
    ctx.unmount();
  });

  it('scrolls focused option into view when navigating up', async () => {
    const ctx = setupWithDom();
    ctx.listRectSpy.mockReturnValue(createRect(0, 20));
    ctx.optionARectSpy.mockReturnValue(createRect(-10, 0));
    ctx.optionBRectSpy.mockReturnValue(createRect(24, 44));

    await tools.act(async () => {
      ctx.result.openDropdown();
      ctx.result.setFocusedIndex(1);
    });

    await tools.act(async () => {
      ctx.result.handleSearchKeydown({ key: 'ArrowUp', preventDefault: vi.fn() });
    });
    await ctx.flushAsync();

    expect(ctx.scrollToSpy).toHaveBeenCalledWith({ top: -10, behavior: 'smooth' });
    ctx.unmount();
  });

  it('does not scroll when focused option is already visible', async () => {
    const ctx = setupWithDom();
    ctx.listRectSpy.mockReturnValue(createRect(0, 40));
    ctx.optionBRectSpy.mockReturnValue(createRect(10, 20));

    await tools.act(async () => {
      ctx.result.openDropdown();
    });

    await tools.act(async () => {
      ctx.result.handleSearchKeydown({ key: 'ArrowDown', preventDefault: vi.fn() });
    });
    await ctx.flushAsync();

    expect(ctx.scrollToSpy).not.toHaveBeenCalled();
    ctx.unmount();
  });

  it('opens the native popover and writes the option max height', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.openDropdown();
    });

    expect(ctx.dropdownTarget.hasAttribute('data-popover-open')).toBe(true);
    expect(ctx.dropdownTarget.dataset.side).toBeUndefined();
    expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dropdown-max-height')).toBe('300px');
    ctx.unmount();
  });

  it('does not open when dropdown or selector refs are unavailable', async () => {
    const missingDropdown = setupWithDom();

    await tools.act(async () => {
      missingDropdown.setDropdownUnavailable();
      missingDropdown.result.openDropdown();
    });

    expect(tools.toValue(missingDropdown.result.dropdownOpen)).toBe(false);
    expect(missingDropdown.dropdownTarget.hasAttribute('data-popover-open')).toBe(false);
    missingDropdown.unmount();

    const missingSelector = setupWithDom();

    await tools.act(async () => {
      missingSelector.setSelectorUnavailable();
      missingSelector.result.openDropdown();
    });

    expect(tools.toValue(missingSelector.result.dropdownOpen)).toBe(false);
    expect(missingSelector.dropdownTarget.hasAttribute('data-popover-open')).toBe(false);
    missingSelector.unmount();
  });

  it('limits option height to the largest available viewport side', async () => {
    const ctx = setupWithDom();
    Object.defineProperty(globalThis, 'innerHeight', {
      value: 200,
      configurable: true
    });
    ctx.rootRectSpy.mockReturnValue(createRect(150, 180, 5, 120));

    await tools.act(async () => {
      ctx.result.openDropdown();
    });

    expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dropdown-max-height')).toBe('78px');
    ctx.unmount();
  });

  it('recomputes option height on resize while open', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.openDropdown();
    });

    ctx.rootRectSpy.mockReturnValue(createRect(150, 180, 5, 200));
    Object.defineProperty(globalThis, 'innerHeight', {
      value: 200,
      configurable: true
    });

    await tools.act(async () => {
      globalThis.dispatchEvent(new Event('resize'));
    });

    expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dropdown-max-height')).toBe('78px');
    ctx.unmount();
  });

  it('closes when country option becomes fixed while open', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.openDropdown();
    });
    expect(tools.toValue(ctx.result.dropdownOpen)).toBe(true);

    await tools.act(async () => {
      ctx.setCountryOptionFixed();
    });

    expect(tools.toValue(ctx.result.dropdownOpen)).toBe(false);
    expect(ctx.dropdownTarget.hasAttribute('data-popover-open')).toBe(false);
    ctx.unmount();
  });

  it('closes when the selector becomes inactive while open', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.openDropdown();
    });
    expect(tools.toValue(ctx.result.dropdownOpen)).toBe(true);

    await tools.act(async () => {
      ctx.setInactive();
    });

    expect(tools.toValue(ctx.result.dropdownOpen)).toBe(false);
    expect(ctx.dropdownTarget.hasAttribute('data-popover-open')).toBe(false);
    ctx.unmount();
  });

  it('keeps the search unfocused on touch open', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.handleSelectorPointerDown({ pointerType: 'touch' } as ReactPointerEvent<HTMLButtonElement>);
      ctx.result.toggleDropdown();
    });
    await ctx.flushAsync();

    expect(ctx.searchFocusSpy).not.toHaveBeenCalled();
    ctx.unmount();
  });

  it('focuses the search input on mouse open', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.handleSelectorPointerDown({ pointerType: 'mouse' } as ReactPointerEvent<HTMLButtonElement>);
      ctx.result.toggleDropdown();
    });
    await ctx.flushAsync();

    expect(ctx.searchFocusSpy).toHaveBeenCalledOnce();
    ctx.unmount();
  });

  it('focuses the search input on keyboard open', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.handleSelectorKeydown({ key: 'ArrowDown', preventDefault: vi.fn() });
    });
    await ctx.flushAsync();

    expect(ctx.searchFocusSpy).toHaveBeenCalledOnce();
    expect(tools.toValue(ctx.result.dropdownOpen)).toBe(true);
    ctx.unmount();
  });

  it('ignores unrelated selector keys', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.handleSelectorKeydown({ key: 'Tab', preventDefault: vi.fn() });
    });
    await ctx.flushAsync();

    expect(ctx.searchFocusSpy).not.toHaveBeenCalled();
    expect(tools.toValue(ctx.result.dropdownOpen)).toBe(false);
    ctx.unmount();
  });

  it('focuses the search input when ArrowDown is pressed while already open', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.openDropdown();
    });
    await ctx.flushAsync();
    ctx.searchFocusSpy.mockClear();

    await tools.act(async () => {
      ctx.result.handleSelectorKeydown({ key: 'ArrowDown', preventDefault: vi.fn() });
    });
    await ctx.flushAsync();

    expect(ctx.searchFocusSpy).toHaveBeenCalledOnce();
    expect(tools.toValue(ctx.result.dropdownOpen)).toBe(true);
    ctx.unmount();
  });

  it('preserves keyboard focus behavior when Space primes the selector before opening', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.handleSelectorKeydown({ key: ' ', preventDefault: vi.fn() });
      ctx.result.toggleDropdown();
    });
    await ctx.flushAsync();

    expect(ctx.searchFocusSpy).toHaveBeenCalledOnce();
    expect(tools.toValue(ctx.result.dropdownOpen)).toBe(true);
    ctx.unmount();
  });

  it('updates state when the popover closes externally', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.handleSelectorKeydown({ key: 'ArrowDown', preventDefault: vi.fn() });
    });
    await ctx.flushAsync();

    await tools.act(async () => {
      ctx.result.handleSearchChange({ target: { value: 'uni' } });
      ctx.dropdownTarget.hidePopover();
    });

    expect(tools.toValue(ctx.result.dropdownOpen)).toBe(false);
    expect(tools.toValue(ctx.result.search)).toBe('');
    expect(tools.toValue(ctx.result.focusedIndex)).toBe(0);
    ctx.unmount();
  });

  it('falls back to current state when a toggle event has no newState', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.openDropdown();
    });

    await tools.act(async () => {
      ctx.dropdownTarget.dispatchEvent(new Event('toggle'));
    });

    expect(tools.toValue(ctx.result.dropdownOpen)).toBe(false);

    await tools.act(async () => {
      ctx.dropdownTarget.dispatchEvent(new Event('toggle'));
    });

    expect(tools.toValue(ctx.result.dropdownOpen)).toBe(true);
    ctx.unmount();
  });

  it('safely ignores resize updates when the root ref becomes unavailable', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.openDropdown();
    });
    expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dropdown-max-height')).toBe('300px');

    await tools.act(async () => {
      ctx.setRootUnavailable();
    });

    expect(tools.toValue(ctx.result.dropdownOpen)).toBe(true);
    expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dropdown-max-height')).toBe('300px');
    ctx.unmount();
  });
});
