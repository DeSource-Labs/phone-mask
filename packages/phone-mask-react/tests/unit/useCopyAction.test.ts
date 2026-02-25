/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react';
import { useCopyAction } from '../../src/hooks/internal/useCopyAction';

const DELAY = 1_800;
const PHONE = '+1 234-567-8901';

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

function setup(fullFormatted = PHONE) {
  const el = document.createElement('div');
  const liveRef = { current: el };
  const onCopy = vi.fn();
  const hook = renderHook(() => useCopyAction({ liveRef, fullFormatted, onCopy }));
  return { el, liveRef, onCopy, ...hook };
}

describe('useCopyAction', () => {
  describe('initial state', () => {
    it('copied is false', () => {
      const { result } = setup();
      expect(result.current.copied).toBe(false);
    });

    it('copyAriaLabel contains the phone number', () => {
      const { result } = setup();
      expect(result.current.copyAriaLabel).toBe(`Copy ${PHONE}`);
    });

    it('copyButtonTitle is "Copy phone number"', () => {
      const { result } = setup();
      expect(result.current.copyButtonTitle).toBe('Copy phone number');
    });
  });

  describe('onCopyClick — success', () => {
    it('calls clipboard.writeText with trimmed value', async () => {
      const { result } = setup(`  ${PHONE}  `);

      await act(async () => {
        await result.current.onCopyClick();
      });

      expect(mockWriteText).toHaveBeenCalledWith(PHONE);
    });

    it('sets copied to true', async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.onCopyClick();
      });

      expect(result.current.copied).toBe(true);
    });

    it('switches labels to "Copied"', async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.onCopyClick();
      });

      expect(result.current.copyAriaLabel).toBe('Copied');
      expect(result.current.copyButtonTitle).toBe('Copied');
    });

    it('calls onCopy callback with trimmed value', async () => {
      const { result, onCopy } = setup(PHONE);

      await act(async () => {
        await result.current.onCopyClick();
      });

      expect(onCopy).toHaveBeenCalledOnce();
      expect(onCopy).toHaveBeenCalledWith(PHONE);
    });

    it('sets liveRef textContent to screen reader announcement', async () => {
      const { result, el } = setup();

      await act(async () => {
        await result.current.onCopyClick();
      });

      expect(el.textContent).toBe('Phone number copied to clipboard');
    });

    it('clears liveRef textContent after DELAY', async () => {
      const { result, el } = setup();

      await act(async () => {
        await result.current.onCopyClick();
      });

      await act(async () => {
        vi.advanceTimersByTime(DELAY);
      });

      expect(el.textContent).toBe('');
    });

    it('resets copied to false after DELAY', async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.onCopyClick();
      });

      expect(result.current.copied).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(DELAY);
      });

      expect(result.current.copied).toBe(false);
    });

    it('restores original labels after DELAY', async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.onCopyClick();
      });

      await act(async () => {
        vi.advanceTimersByTime(DELAY);
      });

      expect(result.current.copyAriaLabel).toBe(`Copy ${PHONE}`);
      expect(result.current.copyButtonTitle).toBe('Copy phone number');
    });
  });

  describe('onCopyClick — failure', () => {
    it('does not call onCopy when clipboard throws', async () => {
      mockWriteText.mockRejectedValue(new Error('Permission denied'));

      const { result, onCopy } = setup(PHONE);

      await act(async () => {
        await result.current.onCopyClick();
      });

      expect(onCopy).not.toHaveBeenCalled();
    });

    it('keeps copied as false when clipboard throws', async () => {
      mockWriteText.mockRejectedValue(new Error('Permission denied'));
      const { result } = setup();

      await act(async () => {
        await result.current.onCopyClick();
      });

      expect(result.current.copied).toBe(false);
    });

    it('does not write to clipboard when fullFormatted is blank', async () => {
      const { result, onCopy } = setup('   ');

      await act(async () => {
        await result.current.onCopyClick();
      });

      expect(mockWriteText).not.toHaveBeenCalled();
      expect(onCopy).not.toHaveBeenCalled();
    });
  });

  describe('onCopy is optional', () => {
    it('does not throw when onCopy is not provided', async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.onCopyClick();
      });

      expect(result.current.copied).toBe(true);
    });
  });

  describe('label reactivity', () => {
    it('copyAriaLabel updates when fullFormatted prop changes', () => {
      const el = document.createElement('div');
      const liveRef = { current: el };

      const { result, rerender } = renderHook(
        (props: { fullFormatted: string }) => useCopyAction({ liveRef, ...props }),
        { initialProps: { fullFormatted: PHONE } }
      );

      expect(result.current.copyAriaLabel).toBe(`Copy ${PHONE}`);

      rerender({ fullFormatted: '+44 20 7946 0958' });

      expect(result.current.copyAriaLabel).toBe('Copy +44 20 7946 0958');
    });
  });
});
