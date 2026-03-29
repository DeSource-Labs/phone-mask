/// <reference types="vitest/globals" />
import type { Mock } from 'vitest';
import type { MaybeRef, TestTools } from './setup/tools';
import { createRect } from './setup/domRect';

export interface CountrySelectorDomSetupResult {
  result: {
    dropdownOpen: MaybeRef<boolean>;
    isClosing?: MaybeRef<boolean>;
    dropdownStyle?: MaybeRef<{
      top?: string | number;
      left?: string | number;
      width?: string | number;
    }>;
    openDropdown: () => void;
    setFocusedIndex: (index: number) => void;
    handleDropdownAnimationEnd?: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSearchKeydown: (e: any) => void;
  };
  unmount: () => void;
  scrollToSpy: Mock;
  listRectSpy: { mockReturnValue: (value: DOMRect) => unknown };
  optionARectSpy: { mockReturnValue: (value: DOMRect) => unknown };
  optionBRectSpy: { mockReturnValue: (value: DOMRect) => unknown };
  rootRectSpy?: { mockReturnValue: (value: DOMRect) => unknown };
  list?: HTMLElement;
  flushAsync: () => Promise<void>;
  setCountryOptionFixed?: () => void | Promise<void>;
  setRootUnavailable?: () => void | Promise<void>;
  completeClose?: () => void;
  dropdownTarget: HTMLElement;
  selectorTarget: HTMLElement;
}

export type CountrySelectorDomSetupFn = () => CountrySelectorDomSetupResult;

export function testUseCountrySelectorDomBehavior(
  setupWithDom: CountrySelectorDomSetupFn,
  { act, toValue }: TestTools
): void {
  describe('useCountrySelector DOM behavior', () => {
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

      await act(async () => {
        ctx.completeClose?.();
      });

      expect(toValue(ctx.result.dropdownOpen)).toBe(false);
      ctx.unmount();
    });

    it('does not close when clicking inside dropdown', async () => {
      const ctx = setupWithDom();
      expect(ctx.dropdownTarget).toBeDefined();

      await act(async () => {
        ctx.result.openDropdown();
      });

      await act(async () => {
        ctx.dropdownTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await ctx.flushAsync();

      expect(toValue(ctx.result.dropdownOpen)).toBe(true);
      ctx.unmount();
    });

    it('does not close when clicking on selector trigger area', async () => {
      const ctx = setupWithDom();
      expect(ctx.selectorTarget).toBeDefined();

      await act(async () => {
        ctx.result.openDropdown();
      });

      await act(async () => {
        ctx.selectorTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await ctx.flushAsync();

      expect(toValue(ctx.result.dropdownOpen)).toBe(true);
      ctx.unmount();
    });

    it('handles click listener events with null target safely', async () => {
      const addListenerSpy = vi.spyOn(globalThis, 'addEventListener');
      const ctx = setupWithDom();

      try {
        await act(async () => {
          ctx.result.openDropdown();
        });

        const clickListener = addListenerSpy.mock.calls.find(([type]) => type === 'click')?.[1];
        expect(clickListener).toBeTypeOf('function');

        expect(() => {
          (clickListener as EventListener)({ target: null } as unknown as Event);
        }).not.toThrow();
        expect(toValue(ctx.result.dropdownOpen)).toBe(true);
      } finally {
        addListenerSpy.mockRestore();
        ctx.unmount();
      }
    });

    it('ignores scroll reposition events coming from inside dropdown', async () => {
      const ctx = setupWithDom();
      if (!ctx.list || !ctx.rootRectSpy || ctx.result.dropdownStyle === undefined) {
        ctx.unmount();
        return;
      }

      expect(ctx.list).toBeDefined();
      expect(ctx.rootRectSpy).toBeDefined();
      expect(ctx.result.dropdownStyle).toBeDefined();

      await act(async () => {
        ctx.result.openDropdown();
      });
      expect(toValue(ctx.result.dropdownStyle).top).toBe('38px');

      ctx.rootRectSpy.mockReturnValue(createRect(100, 140, 5, 200));

      await act(async () => {
        ctx.list!.dispatchEvent(new Event('scroll'));
      });
      await ctx.flushAsync();

      // Style should remain unchanged because internal scroll events are ignored.
      expect(toValue(ctx.result.dropdownStyle).top).toBe('38px');
      expect(toValue(ctx.result.dropdownStyle).width).toBe('120px');
      ctx.unmount();
    });

    it('safely ignores resize positioning when root ref is unavailable', async () => {
      const ctx = setupWithDom();
      expect(ctx.setRootUnavailable).toBeDefined();
      expect(ctx.result.dropdownStyle).toBeDefined();

      await act(async () => {
        ctx.result.openDropdown();
      });
      expect(toValue(ctx.result.dropdownStyle!).width).toBe('120px');

      await act(async () => {
        await ctx.setRootUnavailable!();
      });
      await ctx.flushAsync();

      expect(toValue(ctx.result.dropdownOpen)).toBe(true);
      expect(toValue(ctx.result.dropdownStyle!).width).toBe('120px');
      ctx.unmount();
    });

    it('ignores animation end when dropdown is not closing', async () => {
      const ctx = setupWithDom();
      // Fail test again
      // if (!ctx.result.handleDropdownAnimationEnd) {
      //   ctx.unmount(); // Test not applicable if animation end handler is not implemented (vue)
      //   return;
      // }
      await act(async () => {
        ctx.result.openDropdown();
      });
      expect(toValue(ctx.result.dropdownOpen)).toBe(true);

      await act(async () => {
        ctx.result.handleDropdownAnimationEnd!();
      });

      // Should remain open because isClosing was never set
      expect(toValue(ctx.result.dropdownOpen)).toBe(true);
      if (ctx.result.isClosing !== undefined) {
        expect(toValue(ctx.result.isClosing)).toBe(false);
      }
      ctx.unmount();
    });
  });
}
