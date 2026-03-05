/// <reference types="vitest/globals" />
import type { TestTools } from './setup/tools';

export interface TimerSetupResult {
  result: {
    set: (callback: () => void, delay: number) => void;
    clear: () => void;
  };
  unmount: () => void;
}

export type SetupFn = () => TimerSetupResult;

export function testUseTimer(setup: SetupFn, { act }: TestTools): void {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useTimer', () => {
    describe('set', () => {
      it('fires callback after the given delay', async () => {
        const { result, unmount } = setup();
        const callback = vi.fn();

        await act(() => {
          result.set(callback, 500);
        });

        expect(callback).not.toHaveBeenCalled();

        await act(() => {
          vi.advanceTimersByTime(500);
        });

        expect(callback).toHaveBeenCalledTimes(1);
        unmount();
      });

      it('does not fire callback before the delay elapses', async () => {
        const { result, unmount } = setup();
        const callback = vi.fn();

        await act(() => {
          result.set(callback, 500);
          vi.advanceTimersByTime(499);
        });

        expect(callback).not.toHaveBeenCalled();
        unmount();
      });

      it('cancels previous pending timer when called again', async () => {
        const { result, unmount } = setup();
        const first = vi.fn();
        const second = vi.fn();

        await act(() => {
          result.set(first, 500);
        });

        await act(() => {
          result.set(second, 500);
        });

        await act(() => {
          vi.advanceTimersByTime(500);
        });

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
        unmount();
      });

      it('replaces timer mid-flight and only fires the new callback', async () => {
        const { result, unmount } = setup();
        const first = vi.fn();
        const second = vi.fn();

        await act(() => {
          result.set(first, 500);
        });

        await act(() => {
          vi.advanceTimersByTime(250);
          result.set(second, 500);
        });

        await act(() => {
          vi.advanceTimersByTime(250);
        });

        // First should be cancelled; second has not fired yet
        expect(first).not.toHaveBeenCalled();
        expect(second).not.toHaveBeenCalled();

        await act(() => {
          vi.advanceTimersByTime(250);
        });

        expect(second).toHaveBeenCalledTimes(1);
        unmount();
      });
    });

    describe('clear', () => {
      it('cancels a pending timer so callback never fires', async () => {
        const { result, unmount } = setup();
        const callback = vi.fn();

        await act(() => {
          result.set(callback, 500);
        });

        await act(() => {
          result.clear();
          vi.advanceTimersByTime(500);
        });

        expect(callback).not.toHaveBeenCalled();
        unmount();
      });

      it('does not throw when called with no active timer', async () => {
        const { result, unmount } = setup();

        await act(() => {
          expect(() => result.clear()).not.toThrow();
        });

        unmount();
      });

      it('is idempotent — calling clear twice does not throw', async () => {
        const { result, unmount } = setup();
        const callback = vi.fn();

        await act(() => {
          result.set(callback, 500);
          result.clear();
          expect(() => result.clear()).not.toThrow();
        });

        unmount();
      });
    });

    describe('cleanup on unmount', () => {
      it('cancels a pending timer when the component is unmounted', async () => {
        const { result, unmount } = setup();
        const callback = vi.fn();

        await act(() => {
          result.set(callback, 500);
        });

        unmount();

        await act(() => {
          vi.advanceTimersByTime(500);
        });

        expect(callback).not.toHaveBeenCalled();
      });
    });
  });
}
