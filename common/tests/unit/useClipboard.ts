/// <reference types="vitest/globals" />
import type { MaybeRef, TestTools } from './setup/tools';

export const TEXT = '+1 234-567-8901';
export const DELAY = 1_800;

export interface ClipboardSetupResult {
  result: {
    copied: MaybeRef<boolean>;
    isCopying: MaybeRef<boolean>;
    copy: (text: string) => Promise<boolean>;
  };
  unmount: () => void;
}

export interface SetupOptions {
  delay?: number;
}

export type SetupFn = (options?: SetupOptions) => ClipboardSetupResult;

export function testUseClipboard(setup: SetupFn, { act, toValue }: TestTools): void {
  const mockWriteText = vi.fn();

  beforeAll(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true
    });
  });

  beforeEach(() => {
    vi.useFakeTimers();
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('useClipboard', () => {
    describe('initial state', () => {
      it('copied is false', () => {
        const { result, unmount } = setup();
        expect(toValue(result.copied)).toBe(false);
        unmount();
      });

      it('isCopying is false', () => {
        const { result, unmount } = setup();
        expect(toValue(result.isCopying)).toBe(false);
        unmount();
      });
    });

    describe('copy — success', () => {
      it('calls clipboard.writeText with trimmed text', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          await result.copy(`  ${TEXT}  `);
        });

        expect(mockWriteText).toHaveBeenCalledWith(TEXT);
        unmount();
      });

      it('returns true on success', async () => {
        const { result, unmount } = setup();
        let returnValue = false;

        await act(async () => {
          returnValue = await result.copy(TEXT);
        });

        expect(returnValue).toBe(true);
        unmount();
      });

      it('sets copied to true after successful copy', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          await result.copy(TEXT);
        });

        expect(toValue(result.copied)).toBe(true);
        unmount();
      });

      it('isCopying is false after copy completes', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          await result.copy(TEXT);
        });

        expect(toValue(result.isCopying)).toBe(false);
        unmount();
      });

      it('resets copied to false after delay', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          await result.copy(TEXT);
        });

        expect(toValue(result.copied)).toBe(true);

        await act(async () => {
          vi.advanceTimersByTime(DELAY);
        });

        expect(toValue(result.copied)).toBe(false);
        unmount();
      });

      it('does not reset copied before delay expires', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          await result.copy(TEXT);
        });

        await act(async () => {
          vi.advanceTimersByTime(DELAY - 1);
        });

        expect(toValue(result.copied)).toBe(true);
        unmount();
      });
    });

    describe('copy — failure', () => {
      beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('returns false when clipboard throws', async () => {
        mockWriteText.mockRejectedValue(new Error('Permission denied'));

        const { result, unmount } = setup();
        let returnValue = true;

        await act(async () => {
          returnValue = await result.copy(TEXT);
        });

        expect(returnValue).toBe(false);
        unmount();
      });

      it('keeps copied as false when clipboard throws', async () => {
        mockWriteText.mockRejectedValue(new Error('Permission denied'));

        const { result, unmount } = setup();

        await act(async () => {
          await result.copy(TEXT);
        });

        expect(toValue(result.copied)).toBe(false);
        unmount();
      });

      it('isCopying is false after failed copy', async () => {
        mockWriteText.mockRejectedValue(new Error('Permission denied'));

        const { result, unmount } = setup();

        await act(async () => {
          await result.copy(TEXT);
        });

        expect(toValue(result.isCopying)).toBe(false);
        unmount();
      });
    });

    describe('copy — blank text', () => {
      it('returns false for empty string', async () => {
        const { result, unmount } = setup();
        let returnValue = true;

        await act(async () => {
          returnValue = await result.copy('');
        });

        expect(returnValue).toBe(false);
        unmount();
      });

      it('returns false for whitespace-only text', async () => {
        const { result, unmount } = setup();
        let returnValue = true;

        await act(async () => {
          returnValue = await result.copy('   ');
        });

        expect(returnValue).toBe(false);
        unmount();
      });

      it('does not call clipboard.writeText for blank text', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          await result.copy('   ');
        });

        expect(mockWriteText).not.toHaveBeenCalled();
        unmount();
      });
    });

    describe('isCopying guard', () => {
      it('does not call clipboard.writeText a second time while first copy is in progress', async () => {
        let resolveFirst!: () => void;
        mockWriteText.mockImplementation(
          () =>
            new Promise<void>((r) => {
              resolveFirst = r;
            })
        );

        const { result, unmount } = setup();

        // Start first copy — writeText hangs
        const firstCopy = result.copy(TEXT);

        // Flush isCopying = true state update
        await act(async () => {});

        // Second call — should be blocked by the guard
        await act(async () => {
          await result.copy(TEXT);
        });

        expect(mockWriteText).toHaveBeenCalledOnce();

        // Resolve the first copy and clean up
        resolveFirst();
        await act(async () => {
          await firstCopy;
        });

        unmount();
      });

      it('returns false when called while already copying', async () => {
        let resolveFirst!: () => void;
        mockWriteText.mockImplementation(
          () =>
            new Promise<void>((r) => {
              resolveFirst = r;
            })
        );

        const { result, unmount } = setup();

        const firstCopy = result.copy(TEXT);

        await act(async () => {});

        let secondReturn = true;
        await act(async () => {
          secondReturn = await result.copy(TEXT);
        });

        expect(secondReturn).toBe(false);

        resolveFirst();
        await act(async () => {
          await firstCopy;
        });

        unmount();
      });
    });

    describe('custom delay', () => {
      it('resets copied after custom delay', async () => {
        const customDelay = 500;
        const { result, unmount } = setup({ delay: customDelay });

        await act(async () => {
          await result.copy(TEXT);
        });

        expect(toValue(result.copied)).toBe(true);

        await act(async () => {
          vi.advanceTimersByTime(customDelay);
        });

        expect(toValue(result.copied)).toBe(false);
        unmount();
      });

      it('does not reset copied before custom delay expires', async () => {
        const customDelay = 500;
        const { result, unmount } = setup({ delay: customDelay });

        await act(async () => {
          await result.copy(TEXT);
        });

        await act(async () => {
          vi.advanceTimersByTime(customDelay - 1);
        });

        expect(toValue(result.copied)).toBe(true);
        unmount();
      });
    });
  });
}
