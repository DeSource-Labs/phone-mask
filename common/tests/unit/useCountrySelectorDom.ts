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

    it('scrolls focused option into view when navigating down', async () => {
      const ctx = setupWithDom();

      await act(async () => {
        ctx.result.openDropdown();
      });

      await act(async () => {
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

      await act(async () => {
        ctx.result.openDropdown();
        ctx.result.setFocusedIndex(1);
      });

      await act(async () => {
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

      await act(async () => {
        ctx.result.openDropdown();
      });

      await act(async () => {
        ctx.result.handleSearchKeydown({ key: 'ArrowDown', preventDefault: vi.fn() });
      });
      await ctx.flushAsync();

      expect(ctx.scrollToSpy).not.toHaveBeenCalled();
      ctx.unmount();
    });

    it('opens the native popover and writes the option max height', async () => {
      const ctx = setupWithDom();

      await act(async () => {
        ctx.result.openDropdown();
      });

      expect(ctx.dropdownTarget.hasAttribute('data-popover-open')).toBe(true);
      expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dropdown-max-height')).toBe('300px');
      ctx.unmount();
    });

    it('does not open when dropdown or selector refs are unavailable', async () => {
      const missingDropdown = setupWithDom();
      if (!missingDropdown.setDropdownUnavailable) {
        missingDropdown.unmount();
        return;
      }

      await act(async () => {
        await missingDropdown.setDropdownUnavailable?.();
        missingDropdown.result.openDropdown();
      });

      expect(toValue(missingDropdown.result.dropdownOpen)).toBe(false);
      expect(missingDropdown.dropdownTarget.hasAttribute('data-popover-open')).toBe(false);
      missingDropdown.unmount();

      const missingSelector = setupWithDom();
      if (!missingSelector.setSelectorUnavailable) {
        missingSelector.unmount();
        return;
      }

      await act(async () => {
        await missingSelector.setSelectorUnavailable?.();
        missingSelector.result.openDropdown();
      });

      expect(toValue(missingSelector.result.dropdownOpen)).toBe(false);
      expect(missingSelector.dropdownTarget.hasAttribute('data-popover-open')).toBe(false);
      missingSelector.unmount();
    });

    it('limits option height to the largest available viewport side', async () => {
      const ctx = setupWithDom();
      if (!ctx.rootRectSpy) {
        ctx.unmount();
        return;
      }

      Object.defineProperty(globalThis, 'innerHeight', {
        value: 200,
        configurable: true
      });
      ctx.rootRectSpy.mockReturnValue(createRect(150, 180, 5, 120));

      await act(async () => {
        ctx.result.openDropdown();
      });

      expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dropdown-max-height')).toBe('78px');
      ctx.unmount();
    });

    it('recomputes option height on resize while open', async () => {
      const ctx = setupWithDom();
      if (!ctx.rootRectSpy) {
        ctx.unmount();
        return;
      }

      await act(async () => {
        ctx.result.openDropdown();
      });

      ctx.rootRectSpy.mockReturnValue(createRect(150, 180, 5, 200));
      Object.defineProperty(globalThis, 'innerHeight', {
        value: 200,
        configurable: true
      });

      await act(async () => {
        globalThis.dispatchEvent(new Event('resize'));
      });

      expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dropdown-max-height')).toBe('78px');
      ctx.unmount();
    });

    it('closes when country option becomes fixed while open', async () => {
      const ctx = setupWithDom();
      if (!ctx.setCountryOptionFixed) {
        ctx.unmount();
        return;
      }

      await act(async () => {
        ctx.result.openDropdown();
      });
      expect(toValue(ctx.result.dropdownOpen)).toBe(true);

      await act(async () => {
        ctx.setCountryOptionFixed?.();
      });
      await ctx.flushAsync();

      expect(toValue(ctx.result.dropdownOpen)).toBe(false);
      expect(ctx.dropdownTarget.hasAttribute('data-popover-open')).toBe(false);
      ctx.unmount();
    });

    it('closes when the selector becomes inactive while open', async () => {
      const ctx = setupWithDom();
      if (!ctx.setInactive) {
        ctx.unmount();
        return;
      }

      await act(async () => {
        ctx.result.openDropdown();
      });
      expect(toValue(ctx.result.dropdownOpen)).toBe(true);

      await act(async () => {
        ctx.setInactive?.();
      });
      await ctx.flushAsync();

      expect(toValue(ctx.result.dropdownOpen)).toBe(false);
      expect(ctx.dropdownTarget.hasAttribute('data-popover-open')).toBe(false);
      ctx.unmount();
    });

    it('keeps the search unfocused on touch open', async () => {
      const ctx = setupWithDom();

      await act(async () => {
        ctx.result.handleSelectorPointerDown({ pointerType: 'touch' });
        ctx.result.toggleDropdown();
      });
      await ctx.flushAsync();

      expect(ctx.searchFocusSpy).not.toHaveBeenCalled();
      ctx.unmount();
    });

    it('focuses the search input on mouse open', async () => {
      const ctx = setupWithDom();

      await act(async () => {
        ctx.result.handleSelectorPointerDown({ pointerType: 'mouse' });
        ctx.result.toggleDropdown();
      });
      await ctx.flushAsync();

      expect(ctx.searchFocusSpy).toHaveBeenCalledOnce();
      ctx.unmount();
    });

    it('focuses the search input on keyboard open', async () => {
      const ctx = setupWithDom();

      await act(async () => {
        ctx.result.handleSelectorKeydown({ key: 'ArrowDown', preventDefault: vi.fn() });
      });
      await ctx.flushAsync();

      expect(ctx.searchFocusSpy).toHaveBeenCalledOnce();
      expect(toValue(ctx.result.dropdownOpen)).toBe(true);
      ctx.unmount();
    });

    it('ignores unrelated selector keys', async () => {
      const ctx = setupWithDom();

      await act(async () => {
        ctx.result.handleSelectorKeydown({ key: 'Tab', preventDefault: vi.fn() });
      });
      await ctx.flushAsync();

      expect(ctx.searchFocusSpy).not.toHaveBeenCalled();
      expect(toValue(ctx.result.dropdownOpen)).toBe(false);
      ctx.unmount();
    });

    it('focuses the search input when ArrowDown is pressed while already open', async () => {
      const ctx = setupWithDom();

      await act(async () => {
        ctx.result.openDropdown();
      });
      await ctx.flushAsync();
      ctx.searchFocusSpy.mockClear();

      await act(async () => {
        ctx.result.handleSelectorKeydown({ key: 'ArrowDown', preventDefault: vi.fn() });
      });
      await ctx.flushAsync();

      expect(ctx.searchFocusSpy).toHaveBeenCalledOnce();
      expect(toValue(ctx.result.dropdownOpen)).toBe(true);
      ctx.unmount();
    });

    it('preserves keyboard focus behavior when Space primes the selector before opening', async () => {
      const ctx = setupWithDom();

      await act(async () => {
        ctx.result.handleSelectorKeydown({ key: ' ', preventDefault: vi.fn() });
        ctx.result.toggleDropdown();
      });
      await ctx.flushAsync();

      expect(ctx.searchFocusSpy).toHaveBeenCalledOnce();
      expect(toValue(ctx.result.dropdownOpen)).toBe(true);
      ctx.unmount();
    });

    it('updates state when the popover closes externally', async () => {
      const ctx = setupWithDom();

      await act(async () => {
        ctx.result.handleSelectorKeydown({ key: 'ArrowDown', preventDefault: vi.fn() });
      });
      await ctx.flushAsync();

      await act(async () => {
        ctx.result.handleSearchChange({ target: { value: 'uni' } });
        ctx.dropdownTarget.hidePopover();
      });

      expect(toValue(ctx.result.dropdownOpen)).toBe(false);
      expect(toValue(ctx.result.search)).toBe('');
      expect(toValue(ctx.result.focusedIndex)).toBe(0);
      ctx.unmount();
    });

    it('falls back to current state when a toggle event has no newState', async () => {
      const ctx = setupWithDom();

      await act(async () => {
        ctx.result.openDropdown();
      });

      await act(async () => {
        ctx.dropdownTarget.dispatchEvent(new Event('toggle'));
      });

      expect(toValue(ctx.result.dropdownOpen)).toBe(false);

      await act(async () => {
        ctx.dropdownTarget.dispatchEvent(new Event('toggle'));
      });

      expect(toValue(ctx.result.dropdownOpen)).toBe(true);
      ctx.unmount();
    });

    it('safely ignores resize updates when the root ref becomes unavailable', async () => {
      const ctx = setupWithDom();
      expect(ctx.setRootUnavailable).toBeDefined();

      await act(async () => {
        ctx.result.openDropdown();
      });
      expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dropdown-max-height')).toBe('300px');

      await act(async () => {
        await ctx.setRootUnavailable!();
      });
      await ctx.flushAsync();

      expect(toValue(ctx.result.dropdownOpen)).toBe(true);
      expect(ctx.dropdownTarget.style.getPropertyValue('--pi-dropdown-max-height')).toBe('300px');
      ctx.unmount();
    });
  });
}
