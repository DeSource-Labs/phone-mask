/// <reference types="vitest/globals" />
import type { TestTools } from './setup/tools';

export const DELAY = 1_000;

type MaybeRef<T> = T | { value: T };

export interface ValidationHintSetupResult {
  result: {
    showValidationHint: MaybeRef<boolean>;
    clearValidationHint: (hideHint?: boolean) => void;
    scheduleValidationHint: (delay: number) => void;
  };
  unmount: () => void;
}

export type SetupFn = () => ValidationHintSetupResult;

export function testUseValidationHint(setup: SetupFn, { act, toValue }: TestTools): void {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useValidationHint', () => {
    describe('initial state', () => {
      it('showValidationHint is false', () => {
        const { result, unmount } = setup();
        expect(toValue(result.showValidationHint)).toBe(false);
        unmount();
      });
    });

    describe('scheduleValidationHint', () => {
      it('sets showValidationHint to true after the delay', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.scheduleValidationHint(DELAY);
        });

        expect(toValue(result.showValidationHint)).toBe(false);

        await act(async () => {
          vi.advanceTimersByTime(DELAY);
        });

        expect(toValue(result.showValidationHint)).toBe(true);
        unmount();
      });

      it('does not show hint before the delay elapses', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.scheduleValidationHint(DELAY);
          vi.advanceTimersByTime(DELAY - 1);
        });

        expect(toValue(result.showValidationHint)).toBe(false);
        unmount();
      });

      it('immediately resets showValidationHint to false when called again', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.scheduleValidationHint(DELAY);
          vi.advanceTimersByTime(DELAY);
        });

        expect(toValue(result.showValidationHint)).toBe(true);

        await act(async () => {
          result.scheduleValidationHint(DELAY);
        });

        expect(toValue(result.showValidationHint)).toBe(false);
        unmount();
      });

      it('cancels previous pending timer when called again', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.scheduleValidationHint(DELAY);
        });

        await act(async () => {
          vi.advanceTimersByTime(DELAY / 2);
          result.scheduleValidationHint(DELAY);
        });

        await act(async () => {
          vi.advanceTimersByTime(DELAY / 2);
        });

        // Original timer should be cancelled; new timer has not yet fired
        expect(toValue(result.showValidationHint)).toBe(false);
        unmount();
      });
    });

    describe('clearValidationHint', () => {
      it('sets showValidationHint to false by default', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.scheduleValidationHint(DELAY);
          vi.advanceTimersByTime(DELAY);
        });

        expect(toValue(result.showValidationHint)).toBe(true);

        await act(async () => {
          result.clearValidationHint();
        });

        expect(toValue(result.showValidationHint)).toBe(false);
        unmount();
      });

      it('cancels pending timer', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.scheduleValidationHint(DELAY);
        });

        await act(async () => {
          result.clearValidationHint();
          vi.advanceTimersByTime(DELAY);
        });

        expect(toValue(result.showValidationHint)).toBe(false);
        unmount();
      });

      it('does not hide hint when hideHint is false', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.scheduleValidationHint(DELAY);
          vi.advanceTimersByTime(DELAY);
        });

        expect(toValue(result.showValidationHint)).toBe(true);

        await act(async () => {
          result.clearValidationHint(false);
        });

        expect(toValue(result.showValidationHint)).toBe(true);
        unmount();
      });

      it('still cancels pending timer when hideHint is false', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.scheduleValidationHint(DELAY);
        });

        await act(async () => {
          result.clearValidationHint(false);
          vi.advanceTimersByTime(DELAY);
        });

        expect(toValue(result.showValidationHint)).toBe(false);
        unmount();
      });
    });
  });
}
