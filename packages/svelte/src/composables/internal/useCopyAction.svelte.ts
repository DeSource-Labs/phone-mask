import { useClipboard } from '../utility/useClipboard.svelte.js';
import { useTimer } from '../utility/useTimer.svelte.js';

interface UseCopyActionOptions {
  fullFormatted: () => string;
  liveRef?: () => HTMLElement | null;
  onCopy?: (value: string) => void;
}

const DELAY = 1_800;

export function useCopyAction({ liveRef, fullFormatted, onCopy }: UseCopyActionOptions) {
  const liveTimer = useTimer();
  const clipboard = useClipboard(DELAY);

  const copyAriaLabel = $derived(clipboard.copied ? 'Copied' : `Copy ${fullFormatted()}`);
  const copyButtonTitle = $derived(clipboard.copied ? 'Copied' : 'Copy phone number');

  const onCopyClick = async () => {
    const valueToCopy = fullFormatted().trim();
    const success = await clipboard.copy(valueToCopy);
    if (success) {
      onCopy?.(valueToCopy);
      const el = liveRef?.();
      if (el) {
        el.textContent = 'Phone number copied to clipboard';
        liveTimer.set(() => {
          const el = liveRef?.();
          if (el) el.textContent = '';
        }, DELAY);
      }
    }
  };

  return {
    get copied() {
      return clipboard.copied;
    },
    get copyAriaLabel() {
      return copyAriaLabel;
    },
    get copyButtonTitle() {
      return copyButtonTitle;
    },
    onCopyClick
  };
}
