/// <reference types="vitest/globals" />
import type { MaybeRef, TestTools } from './setup/tools';

export type Theme = 'auto' | 'light' | 'dark';

export interface SetupOptions {
  theme: Theme;
}

export interface ThemeSetupResult {
  result: {
    themeClass: MaybeRef<string>;
  };
  unmount: () => void;
  rerender: (props: SetupOptions) => void;
}

export type SetupFn = (options: SetupOptions) => ThemeSetupResult;

export function testUseTheme(setup: SetupFn, { act, toValue }: TestTools): void {
  let changeHandler: ((e: { matches: boolean }) => void) | undefined;
  let mockMatches = false;
  const mockRemoveEventListener = vi.fn();
  const mockMatchMedia = vi.fn();

  beforeAll(() => {
    mockMatchMedia.mockImplementation((query: string) => ({
      get matches() {
        return mockMatches;
      },
      media: query,
      addEventListener: (type: string, handler: (e: { matches: boolean }) => void) => {
        if (type === 'change') changeHandler = handler;
      },
      removeEventListener: mockRemoveEventListener,
      dispatchEvent: vi.fn()
    }));

    Object.defineProperty(globalThis, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
      configurable: true
    });
  });

  beforeEach(() => {
    mockMatches = false;
    changeHandler = undefined;
    mockRemoveEventListener.mockReset();
    mockMatchMedia.mockClear();
  });

  describe('useTheme', () => {
    describe('static themes', () => {
      it('returns theme-light when theme is "light"', () => {
        const { result, unmount } = setup({ theme: 'light' });
        expect(toValue(result.themeClass)).toBe('theme-light');
        unmount();
      });

      it('returns theme-dark when theme is "dark"', () => {
        const { result, unmount } = setup({ theme: 'dark' });
        expect(toValue(result.themeClass)).toBe('theme-dark');
        unmount();
      });

      it('ignores system dark preference when theme is static', () => {
        mockMatches = true; // system is dark
        const { result, unmount } = setup({ theme: 'light' });
        expect(toValue(result.themeClass)).toBe('theme-light');
        unmount();
      });
    });

    describe('auto theme — initial system preference', () => {
      it('returns theme-light when system prefers light (matches = false)', () => {
        mockMatches = false;
        const { result, unmount } = setup({ theme: 'auto' });
        expect(toValue(result.themeClass)).toBe('theme-light');
        unmount();
      });

      it('returns theme-dark when system prefers dark (matches = true)', () => {
        mockMatches = true;
        const { result, unmount } = setup({ theme: 'auto' });
        expect(toValue(result.themeClass)).toBe('theme-dark');
        unmount();
      });
    });

    describe('auto theme — OS preference changes at runtime', () => {
      it('switches to theme-dark when OS changes to dark', async () => {
        mockMatches = false;
        const { result, unmount } = setup({ theme: 'auto' });

        expect(toValue(result.themeClass)).toBe('theme-light');

        await act(async () => {
          changeHandler?.({ matches: true });
        });

        expect(toValue(result.themeClass)).toBe('theme-dark');
        unmount();
      });

      it('switches to theme-light when OS changes back to light', async () => {
        mockMatches = true;
        const { result, unmount } = setup({ theme: 'auto' });

        expect(toValue(result.themeClass)).toBe('theme-dark');

        await act(async () => {
          changeHandler?.({ matches: false });
        });

        expect(toValue(result.themeClass)).toBe('theme-light');
        unmount();
      });
    });

    describe('theme prop reactivity', () => {
      it('updates themeClass when theme changes from light to dark', async () => {
        const { result, rerender, unmount } = setup({ theme: 'light' });

        expect(toValue(result.themeClass)).toBe('theme-light');

        await act(async () => {
          rerender({ theme: 'dark' });
        });

        expect(toValue(result.themeClass)).toBe('theme-dark');
        unmount();
      });

      it('updates themeClass when theme changes from auto to light (overrides system dark)', async () => {
        mockMatches = true; // system is dark
        const { result, rerender, unmount } = setup({ theme: 'auto' });

        expect(toValue(result.themeClass)).toBe('theme-dark');

        await act(async () => {
          rerender({ theme: 'light' });
        });

        expect(toValue(result.themeClass)).toBe('theme-light');
        unmount();
      });

      it('updates themeClass when theme changes from dark to auto (reflects system preference)', async () => {
        mockMatches = false; // system is light
        const { result, rerender, unmount } = setup({ theme: 'dark' });

        expect(toValue(result.themeClass)).toBe('theme-dark');

        await act(async () => {
          rerender({ theme: 'auto' });
        });

        expect(toValue(result.themeClass)).toBe('theme-light');
        unmount();
      });
    });

    describe('event listener cleanup', () => {
      it('removes the matchMedia change listener on unmount', () => {
        const { unmount } = setup({ theme: 'auto' });
        unmount();
        expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      });

      it('removes the same handler instance that was registered', () => {
        const { unmount } = setup({ theme: 'auto' });

        const registeredHandler = changeHandler;
        unmount();

        const [, removedHandler] = mockRemoveEventListener.mock.calls[0];
        expect(removedHandler).toBe(registeredHandler);
      });
    });

    describe('useTheme fallback', () => {
      it('returns auto theme without matchMedia support', () => {
        vi.stubGlobal('matchMedia', undefined);

        const { result, unmount } = setup({ theme: 'auto' });
        expect(toValue(result.themeClass)).toBe('theme-light');
        unmount();
      });
    });
  });
}
