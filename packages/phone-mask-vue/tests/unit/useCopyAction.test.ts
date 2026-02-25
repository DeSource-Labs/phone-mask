/// <reference types="vitest/globals" />
import { ref, nextTick, createApp, h } from 'vue';
import { useCopyAction } from '../../src/composables/internal/useCopyAction';

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

/**
 * Mounts a temporary Vue app to run the composable within a component lifecycle.
 * Required so that `onUnmounted` hooks (used by useTimer) are properly registered.
 */
function withSetup<T>(composable: () => T) {
  let result!: T;
  const app = createApp({
    setup() {
      result = composable();
      return {};
    },
    render: () => h('div')
  });
  app.mount(document.createElement('div'));
  return { result, unmount: () => app.unmount() };
}

interface SetupOptions {
  /** Override the initial phone number string. Defaults to PHONE. */
  fullFormatted?: string;
  /** When true, liveRef is bound to a real DOM element (needed for textContent assertions). */
  withElement?: boolean;
}

function setup(options: SetupOptions = {}) {
  const el = document.createElement('div');
  const liveRef = ref<HTMLElement | null>(options.withElement ? el : null);
  const fullFormatted = ref(options.fullFormatted ?? PHONE);
  const onCopy = vi.fn();

  const { result, unmount } = withSetup(() => useCopyAction({ liveRef, fullFormatted, onCopy }));

  return { result, unmount, onCopy, el, fullFormatted };
}

describe('useCopyAction', () => {
  describe('initial state', () => {
    it('copied is false', () => {
      const { result, unmount } = setup();
      expect(result.copied.value).toBe(false);
      unmount();
    });

    it('copyAriaLabel contains the phone number', () => {
      const { result, unmount } = setup();
      expect(result.copyAriaLabel.value).toBe(`Copy ${PHONE}`);
      unmount();
    });

    it('copyButtonTitle is "Copy phone number"', () => {
      const { result, unmount } = setup();
      expect(result.copyButtonTitle.value).toBe('Copy phone number');
      unmount();
    });
  });

  describe('onCopyClick — success', () => {
    it('calls clipboard.writeText with trimmed value', async () => {
      const { result, unmount } = setup({ fullFormatted: `  ${PHONE}  ` });

      await result.onCopyClick();

      expect(mockWriteText).toHaveBeenCalledWith(PHONE);
      unmount();
    });

    it('sets copied to true', async () => {
      const { result, unmount } = setup();

      await result.onCopyClick();
      await nextTick();

      expect(result.copied.value).toBe(true);
      unmount();
    });

    it('switches computed labels to "Copied"', async () => {
      const { result, unmount } = setup();

      await result.onCopyClick();
      await nextTick();

      expect(result.copyAriaLabel.value).toBe('Copied');
      expect(result.copyButtonTitle.value).toBe('Copied');
      unmount();
    });

    it('calls onCopy callback with trimmed value', async () => {
      const { result, unmount, onCopy } = setup();

      await result.onCopyClick();

      expect(onCopy).toHaveBeenCalledOnce();
      expect(onCopy).toHaveBeenCalledWith(PHONE);
      unmount();
    });

    it('sets liveRef textContent to screen reader announcement', async () => {
      const { result, unmount, el } = setup({ withElement: true });

      await result.onCopyClick();

      expect(el.textContent).toBe('Phone number copied to clipboard');
      unmount();
    });

    it('clears liveRef textContent after DELAY', async () => {
      const { result, unmount, el } = setup({ withElement: true });

      await result.onCopyClick();
      vi.advanceTimersByTime(DELAY);
      await nextTick();

      expect(el.textContent).toBe('');
      unmount();
    });

    it('resets copied to false after DELAY', async () => {
      const { result, unmount } = setup();

      await result.onCopyClick();
      await nextTick();
      expect(result.copied.value).toBe(true);

      vi.advanceTimersByTime(DELAY);
      await nextTick();

      expect(result.copied.value).toBe(false);
      unmount();
    });

    it('restores original labels after DELAY', async () => {
      const { result, unmount } = setup();

      await result.onCopyClick();
      await nextTick();

      vi.advanceTimersByTime(DELAY);
      await nextTick();

      expect(result.copyAriaLabel.value).toBe(`Copy ${PHONE}`);
      expect(result.copyButtonTitle.value).toBe('Copy phone number');
      unmount();
    });
  });

  describe('onCopyClick — failure', () => {
    it('does not call onCopy when clipboard throws', async () => {
      mockWriteText.mockRejectedValue(new Error('Permission denied'));
      const { result, unmount, onCopy } = setup();

      await result.onCopyClick();

      expect(onCopy).not.toHaveBeenCalled();
      unmount();
    });

    it('keeps copied as false when clipboard throws', async () => {
      mockWriteText.mockRejectedValue(new Error('Permission denied'));
      const { result, unmount } = setup();

      await result.onCopyClick();
      await nextTick();

      expect(result.copied.value).toBe(false);
      unmount();
    });

    it('does not write to clipboard when fullFormatted is blank', async () => {
      const { result, unmount, onCopy } = setup({ fullFormatted: '   ' });

      await result.onCopyClick();

      expect(mockWriteText).not.toHaveBeenCalled();
      expect(onCopy).not.toHaveBeenCalled();
      unmount();
    });

    it('skips screen reader announcement when liveRef is null', async () => {
      const { result, unmount, onCopy } = setup();

      await expect(result.onCopyClick()).resolves.not.toThrow();
      // onCopy still called even though liveRef is null
      expect(onCopy).toHaveBeenCalledWith(PHONE);
      unmount();
    });
  });

  describe('label reactivity', () => {
    it('copyAriaLabel updates when fullFormatted ref changes', async () => {
      const { result, unmount, fullFormatted } = setup();

      expect(result.copyAriaLabel.value).toBe(`Copy ${PHONE}`);

      fullFormatted.value = '+44 20 7946 0958';
      await nextTick();

      expect(result.copyAriaLabel.value).toBe('Copy +44 20 7946 0958');
      unmount();
    });
  });
});
