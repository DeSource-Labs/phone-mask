/// <reference types="vitest/globals" />
import type { Mock } from 'vitest';
import type { MaybeRef, TestTools } from './setup/tools';
import { createRect } from './setup/domRect';

export interface CountrySelectorDomSetupResult {
  result: {
    dropdownOpen: MaybeRef<boolean>;
    openDropdown: () => void;
    setFocusedIndex: (index: number) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSearchKeydown: (e: any) => void;
  };
  unmount: () => void;
  scrollToSpy: Mock;
  listRectSpy: { mockReturnValue: (value: DOMRect) => unknown };
  optionARectSpy: { mockReturnValue: (value: DOMRect) => unknown };
  optionBRectSpy: { mockReturnValue: (value: DOMRect) => unknown };
  flushAsync: () => Promise<void>;
  setCountryOptionFixed?: () => void | Promise<void>;
  completeClose?: () => void;
  dropdownTarget?: HTMLElement;
  selectorTarget?: HTMLElement;
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
        ctx.dropdownTarget!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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
        ctx.selectorTarget!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await ctx.flushAsync();

      expect(toValue(ctx.result.dropdownOpen)).toBe(true);
      ctx.unmount();
    });
  });
}
