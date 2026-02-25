/// <reference types="vitest/globals" />
import type { Mock } from 'vitest';

import type { TestTools } from './setup/tools';

export const DELAY = 1_800;
export const PHONE = '+1 234-567-8901';

type MaybeRef<T> = T | { value: T };

export interface CopyActionSetupResult {
  result: {
    copied: MaybeRef<boolean>;
    copyAriaLabel: MaybeRef<string>;
    copyButtonTitle: MaybeRef<string>;
    onCopyClick: () => Promise<void>;
  };
  unmount: () => void;
  rerender: (props: { fullFormatted: string }) => void;
  el: HTMLElement;
  onCopy: Mock;
}

export type SetupFn = (formattedPhoneNumber: string) => CopyActionSetupResult;

export function testUseCopyAction(setup: SetupFn, { act, toValue }: TestTools): void {
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

  describe('useCopyAction', () => {
    describe('initial state', () => {
      it('copied is false', () => {
        const { result, unmount } = setup(PHONE);
        expect(toValue(result.copied)).toBe(false);
        unmount();
      });

      it('copyAriaLabel contains the phone number', () => {
        const { result, unmount } = setup(PHONE);
        expect(toValue(result.copyAriaLabel)).toBe(`Copy ${PHONE}`);
        unmount();
      });

      it('copyButtonTitle is "Copy phone number"', () => {
        const { result, unmount } = setup(PHONE);
        expect(toValue(result.copyButtonTitle)).toBe('Copy phone number');
        unmount();
      });
    });

    describe('onCopyClick — success', () => {
      it('calls clipboard.writeText with trimmed value', async () => {
        const { result, unmount } = setup(`  ${PHONE}  `);

        await act(async () => {
          await result.onCopyClick();
        });

        expect(mockWriteText).toHaveBeenCalledWith(PHONE);
        unmount();
      });

      it('sets copied to true', async () => {
        const { result, unmount } = setup(PHONE);

        await act(async () => {
          await result.onCopyClick();
        });

        expect(toValue(result.copied)).toBe(true);
        unmount();
      });

      it('switches labels to "Copied"', async () => {
        const { result, unmount } = setup(PHONE);

        await act(async () => {
          await result.onCopyClick();
        });

        expect(toValue(result.copyAriaLabel)).toBe('Copied');
        expect(toValue(result.copyButtonTitle)).toBe('Copied');
        unmount();
      });

      it('calls onCopy callback with trimmed value', async () => {
        const { result, onCopy, unmount } = setup(PHONE);

        await act(async () => {
          await result.onCopyClick();
        });

        expect(onCopy).toHaveBeenCalledOnce();
        expect(onCopy).toHaveBeenCalledWith(PHONE);
        unmount();
      });

      it('sets liveRef textContent to screen reader announcement', async () => {
        const { result, el, unmount } = setup(PHONE);

        await act(async () => {
          await result.onCopyClick();
        });

        expect(el.textContent).toBe('Phone number copied to clipboard');
        unmount();
      });

      it('clears liveRef textContent after DELAY', async () => {
        const { result, el, unmount } = setup(PHONE);

        await act(async () => {
          await result.onCopyClick();
        });

        await act(async () => {
          vi.advanceTimersByTime(DELAY);
        });

        expect(el.textContent).toBe('');
        unmount();
      });

      it('resets copied to false after DELAY', async () => {
        const { result, unmount } = setup(PHONE);

        await act(async () => {
          await result.onCopyClick();
        });

        expect(toValue(result.copied)).toBe(true);

        await act(async () => {
          vi.advanceTimersByTime(DELAY);
        });

        expect(toValue(result.copied)).toBe(false);
        unmount();
      });

      it('restores original labels after DELAY', async () => {
        const { result, unmount } = setup(PHONE);

        await act(async () => {
          await result.onCopyClick();
        });

        await act(async () => {
          vi.advanceTimersByTime(DELAY);
        });

        expect(toValue(result.copyAriaLabel)).toBe(`Copy ${PHONE}`);
        expect(toValue(result.copyButtonTitle)).toBe('Copy phone number');
        unmount();
      });
    });

    describe('onCopyClick — failure', () => {
      it('does not call onCopy when clipboard throws', async () => {
        mockWriteText.mockRejectedValue(new Error('Permission denied'));

        const { result, onCopy, unmount } = setup(PHONE);

        await act(async () => {
          await result.onCopyClick();
        });

        expect(onCopy).not.toHaveBeenCalled();
        unmount();
      });

      it('keeps copied as false when clipboard throws', async () => {
        mockWriteText.mockRejectedValue(new Error('Permission denied'));

        const { result, unmount } = setup(PHONE);

        await act(async () => {
          await result.onCopyClick();
        });

        expect(toValue(result.copied)).toBe(false);
        unmount();
      });

      it('does not write to clipboard when fullFormatted is blank', async () => {
        const { result, onCopy, unmount } = setup('   ');

        await act(async () => {
          await result.onCopyClick();
        });

        expect(mockWriteText).not.toHaveBeenCalled();
        expect(onCopy).not.toHaveBeenCalled();
        unmount();
      });
    });

    describe('label reactivity', () => {
      it('copyAriaLabel updates when fullFormatted changes', async () => {
        const { result, rerender, unmount } = setup(PHONE);

        expect(toValue(result.copyAriaLabel)).toBe(`Copy ${PHONE}`);

        await act(async () => {
          rerender({ fullFormatted: '+44 20 7946 0958' });
        });

        expect(toValue(result.copyAriaLabel)).toBe('Copy +44 20 7946 0958');
        unmount();
      });
    });
  });
}
