import { useClipboard } from '../utility/useClipboard.svelte';
import { useTimer } from '../utility/useTimer.svelte';

interface UseCopyActionOptions {
  fullFormatted: () => string;
  liveRef?: () => HTMLElement | null;
  onCopy?: (value: string) => void;
}

const DELAY = 1_800;

export function useCopyAction({ liveRef, fullFormatted, onCopy }: UseCopyActionOptions) {
  const liveTimer = useTimer();
  const { copied, copy } = useClipboard(DELAY);

  const copyAriaLabel = $derived(copied ? 'Copied' : `Copy ${fullFormatted()}`);
  const copyButtonTitle = $derived(copied ? 'Copied' : 'Copy phone number');

  const announceToScreenReader = (message: string) => {
    const el = liveRef?.();
    if (!el) return;
    el.textContent = message;
    liveTimer.set(() => {
      const el = liveRef?.();
      if (el) el.textContent = '';
    }, DELAY);
  };

  const onCopyClick = async () => {
    const valueToCopy = fullFormatted().trim();
    const success = await copy(valueToCopy);
    if (success) {
      onCopy?.(valueToCopy);
      announceToScreenReader('Phone number copied to clipboard');
    }
  };

  return {
    get copied() {
      return copied;
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
