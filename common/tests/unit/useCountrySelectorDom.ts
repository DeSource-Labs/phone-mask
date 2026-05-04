/// <reference types="vitest/globals" />
import type { Mock } from 'vitest';
import type { MaybeRef, TestTools } from './setup/tools';
import { createRect } from './setup/domRect';

export interface CountrySelectorDomSetupResult {
  result: {
    dropdownOpen: MaybeRef<boolean>;
    search: MaybeRef<string>;
    focusedIndex: MaybeRef<number>;
    openDropdown: () => void;
    toggleDropdown: () => void;
    setFocusedIndex: (index: number) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSearchChange: (e: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSearchKeydown: (e: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSelectorPointerDown: (e: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSelectorKeydown: (e: any) => void;
  };
  unmount: () => void;
  scrollToSpy: Mock;
  listRectSpy: { mockReturnValue: (value: DOMRect) => unknown };
  optionARectSpy: { mockReturnValue: (value: DOMRect) => unknown };
  optionBRectSpy: { mockReturnValue: (value: DOMRect) => unknown };
  rootRectSpy?: { mockReturnValue: (value: DOMRect) => unknown };
  list?: HTMLElement;
  searchFocusSpy: Mock;
  flushAsync: () => Promise<void>;
  setCountryOptionFixed?: () => void | Promise<void>;
  setInactive?: () => void | Promise<void>;
  setRootUnavailable?: () => void | Promise<void>;
  setDropdownUnavailable?: () => void | Promise<void>;
  setSelectorUnavailable?: () => void | Promise<void>;
  dropdownTarget: HTMLElement;
  selectorTarget: HTMLElement;
}

export type CountrySelectorDomSetupFn = () => CountrySelectorDomSetupResult;

export function testUseCountrySelectorDomBehavior(
  setupWithDom: CountrySelectorDomSetupFn,
  { act, toValue }: TestTools
): void {
  describe('useCountrySelector DOM behavior', () => {
    let originalInnerHeight = globalThis.innerHeight;

    beforeEach(() => {
      originalInnerHeight = globalThis.innerHeight;
    });

    afterEach(() => {
      Object.defineProperty(globalThis, 'innerHeight', {
        value: originalInnerHeight,
        configurable: true
      });
    });

    const withDom = async (run: (ctx: CountrySelectorDomSetupResult) => Promise<void>) => {
      const ctx = setupWithDom();
      try {
        await run(ctx);
      } finally {
        ctx.unmount();
      }
    };

    const openDropdown = (ctx: CountrySelectorDomSetupResult) =>
      act(async () => {
        ctx.result.openDropdown();
      });

    const pressSearchKey = async (ctx: CountrySelectorDomSetupResult, key: string) => {
      await act(async () => {
        ctx.result.handleSearchKeydown({ key, preventDefault: vi.fn() });
      });
      await ctx.flushAsync();
    };

    const pressSelectorKey = async (ctx: CountrySelectorDomSetupResult, key: string) => {
      await act(async () => {
        ctx.result.handleSelectorKeydown({ key, preventDefault: vi.fn() });
      });
      await ctx.flushAsync();
    };

    const expectPopoverClosed = (ctx: CountrySelectorDomSetupResult) => {
      expect(toValue(ctx.result.dropdownOpen)).toBe(false);
      expect(ctx.dropdownTarget.dataset.popoverOpen).toBeUndefined();
    };

    const setCompactViewport = (ctx: CountrySelectorDomSetupResult, width = 120) => {
      Object.defineProperty(globalThis, 'innerHeight', {
        value: 200,
        configurable: true
      });
      ctx.rootRectSpy?.mockReturnValue(createRect(150, 180, 5, width));
    };

    it('scrolls focused option into view when navigating down', async () => {
      await withDom(async (ctx) => {
        await openDropdown(ctx);
        await pressSearchKey(ctx, 'ArrowDown');
        expect(ctx.scrollToSpy).toHaveBeenCalledWith({ top: 24, behavior: 'smooth' });
      });
    });

    it('scrolls focused option into view when navigating up', async () => {
      await withDom(async (ctx) => {
        ctx.listRectSpy.mockReturnValue(createRect(0, 20));
        ctx.optionARectSpy.mockReturnValue(createRect(-10, 0));
        ctx.optionBRectSpy.mockReturnValue(createRect(24, 44));

        await act(async () => {
          ctx.result.openDropdown();
          ctx.result.setFocusedIndex(1);
        });
        await pressSearchKey(ctx, 'ArrowUp');

        expect(ctx.scrollToSpy).toHaveBeenCalledWith({ top: -10, behavior: 'smooth' });
      });
    });

    it('does not scroll when focused option is already visible', async () => {
      await withDom(async (ctx) => {
        ctx.listRectSpy.mockReturnValue(createRect(0, 40));
        ctx.optionBRectSpy.mockReturnValue(createRect(10, 20));

        await openDropdown(ctx);
        await pressSearchKey(ctx, 'ArrowDown');

        expect(ctx.scrollToSpy).not.toHaveBeenCalled();
      });
    });

    it('opens the native popover and writes the option max height', async () => {
      await withDom(async (ctx) => {
        await openDropdown(ctx);
        expect(ctx.dropdownTarget.dataset.popoverOpen).toBe('');
        expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dropdown-max-height')).toBe('300px');
      });
    });

    it.each([
      ['dropdown', 'setDropdownUnavailable'],
      ['selector', 'setSelectorUnavailable']
    ] as const)('does not open when %s ref is unavailable', async (_, setterKey) => {
      await withDom(async (ctx) => {
        await act(async () => {
          await ctx[setterKey]?.();
          ctx.result.openDropdown();
        });

        expectPopoverClosed(ctx);
      });
    });

    it('limits option height to the largest available viewport side', async () => {
      await withDom(async (ctx) => {
        setCompactViewport(ctx);
        await openDropdown(ctx);
        expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dropdown-max-height')).toBe('78px');
      });
    });

    it('recomputes option height on resize while open', async () => {
      await withDom(async (ctx) => {
        await openDropdown(ctx);
        setCompactViewport(ctx, 200);

        await act(async () => {
          globalThis.dispatchEvent(new Event('resize'));
        });

        expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dropdown-max-height')).toBe('78px');
      });
    });

    it.each([
      ['country option becomes fixed', 'setCountryOptionFixed'],
      ['selector becomes inactive', 'setInactive']
    ] as const)('closes when %s while open', async (_, setterKey) => {
      await withDom(async (ctx) => {
        await openDropdown(ctx);
        expect(toValue(ctx.result.dropdownOpen)).toBe(true);

        await act(async () => {
          await ctx[setterKey]?.();
        });
        await ctx.flushAsync();

        expectPopoverClosed(ctx);
      });
    });

    it.each([
      ['touch', false],
      ['mouse', true]
    ] as const)('uses %s pointer focus behavior', async (pointerType, shouldFocus) => {
      await withDom(async (ctx) => {
        await act(async () => {
          ctx.result.handleSelectorPointerDown({ pointerType });
          ctx.result.toggleDropdown();
        });
        await ctx.flushAsync();

        if (shouldFocus) {
          expect(ctx.searchFocusSpy).toHaveBeenCalledOnce();
        } else {
          expect(ctx.searchFocusSpy).not.toHaveBeenCalled();
        }
      });
    });

    it('focuses the search input on keyboard open', async () => {
      await withDom(async (ctx) => {
        await pressSelectorKey(ctx, 'ArrowDown');
        expect(ctx.searchFocusSpy).toHaveBeenCalledOnce();
        expect(toValue(ctx.result.dropdownOpen)).toBe(true);
      });
    });

    it('ignores unrelated selector keys', async () => {
      await withDom(async (ctx) => {
        await pressSelectorKey(ctx, 'Tab');
        expect(ctx.searchFocusSpy).not.toHaveBeenCalled();
        expect(toValue(ctx.result.dropdownOpen)).toBe(false);
      });
    });

    it('focuses the search input when ArrowDown is pressed while already open', async () => {
      await withDom(async (ctx) => {
        await openDropdown(ctx);
        await ctx.flushAsync();
        ctx.searchFocusSpy.mockClear();

        await pressSelectorKey(ctx, 'ArrowDown');

        expect(ctx.searchFocusSpy).toHaveBeenCalledOnce();
        expect(toValue(ctx.result.dropdownOpen)).toBe(true);
      });
    });

    it('preserves keyboard focus behavior when Space primes the selector before opening', async () => {
      await withDom(async (ctx) => {
        await act(async () => {
          ctx.result.handleSelectorKeydown({ key: ' ', preventDefault: vi.fn() });
          ctx.result.toggleDropdown();
        });
        await ctx.flushAsync();

        expect(ctx.searchFocusSpy).toHaveBeenCalledOnce();
        expect(toValue(ctx.result.dropdownOpen)).toBe(true);
      });
    });

    it('updates state when the popover closes externally', async () => {
      await withDom(async (ctx) => {
        await pressSelectorKey(ctx, 'ArrowDown');

        await act(async () => {
          ctx.result.handleSearchChange({ target: { value: 'uni' } });
          ctx.dropdownTarget.hidePopover();
        });

        expect(toValue(ctx.result.dropdownOpen)).toBe(false);
        expect(toValue(ctx.result.search)).toBe('');
        expect(toValue(ctx.result.focusedIndex)).toBe(0);
      });
    });

    it('falls back to current state when a toggle event has no newState', async () => {
      await withDom(async (ctx) => {
        await openDropdown(ctx);

        for (const expected of [false, true]) {
          await act(async () => {
            ctx.dropdownTarget.dispatchEvent(new Event('toggle'));
          });
          expect(toValue(ctx.result.dropdownOpen)).toBe(expected);
        }
      });
    });

    it('safely ignores resize updates when the root ref becomes unavailable', async () => {
      await withDom(async (ctx) => {
        expect(ctx.setRootUnavailable).toBeDefined();

        await openDropdown(ctx);
        expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dropdown-max-height')).toBe('300px');

        await act(async () => {
          await ctx.setRootUnavailable!();
        });
        await ctx.flushAsync();

        expect(toValue(ctx.result.dropdownOpen)).toBe(true);
        expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dropdown-max-height')).toBe('300px');
      });
    });
  });
}
