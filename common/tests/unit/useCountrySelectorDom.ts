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
  optionAScrollIntoViewSpy: Mock;
  optionBScrollIntoViewSpy: Mock;
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

    const expectDropdownClosed = (ctx: CountrySelectorDomSetupResult) => {
      expect(toValue(ctx.result.dropdownOpen)).toBe(false);
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
        expect(ctx.optionBScrollIntoViewSpy).toHaveBeenCalledWith({ block: 'nearest' });
      });
    });

    it('scrolls focused option into view when navigating up', async () => {
      await withDom(async (ctx) => {
        await act(async () => {
          ctx.result.openDropdown();
          ctx.result.setFocusedIndex(1);
        });
        await pressSearchKey(ctx, 'ArrowUp');

        expect(ctx.optionAScrollIntoViewSpy).toHaveBeenCalledWith({ block: 'nearest' });
      });
    });

    it('opens the dropdown and writes fixed positioning styles', async () => {
      await withDom(async (ctx) => {
        await openDropdown(ctx);
        expect(toValue(ctx.result.dropdownOpen)).toBe(true);
        expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dd-top')).toBe('38px');
        expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dd-left')).toBe('8px');
        expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dd-width')).toBe('120px');
        expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dd-max-height')).toBe('300px');
        expect(ctx.dropdownTarget.dataset.placement).toBe('bottom');
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

        expectDropdownClosed(ctx);
      });
    });

    it('limits option height to the largest available viewport side', async () => {
      await withDom(async (ctx) => {
        setCompactViewport(ctx);
        await openDropdown(ctx);
        expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dd-max-height')).toBe('78px');
        expect(ctx.dropdownTarget.dataset.placement).toBe('top');
      });
    });

    it('recomputes option height on resize while open', async () => {
      await withDom(async (ctx) => {
        await openDropdown(ctx);
        setCompactViewport(ctx, 200);

        await act(async () => {
          globalThis.dispatchEvent(new Event('resize'));
        });

        expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dd-max-height')).toBe('78px');
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

        expectDropdownClosed(ctx);
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

    it('resets state when Escape closes the dropdown', async () => {
      await withDom(async (ctx) => {
        await pressSelectorKey(ctx, 'ArrowDown');

        await act(async () => {
          ctx.result.handleSearchChange({ target: { value: 'uni' } });
          ctx.result.setFocusedIndex(2);
          globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        });
        await ctx.flushAsync();

        expectDropdownClosed(ctx);
        expect(toValue(ctx.result.search)).toBe('');
        expect(toValue(ctx.result.focusedIndex)).toBe(0);
      });
    });

    it('safely ignores resize updates when the root ref becomes unavailable', async () => {
      await withDom(async (ctx) => {
        expect(ctx.setRootUnavailable).toBeDefined();

        await openDropdown(ctx);
        expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dd-max-height')).toBe('300px');

        await act(async () => {
          await ctx.setRootUnavailable!();
        });
        await ctx.flushAsync();

        expect(toValue(ctx.result.dropdownOpen)).toBe(true);
        expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dd-max-height')).toBe('300px');
      });
    });
  });
}
