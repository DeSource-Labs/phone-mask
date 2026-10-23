import type { RefObject } from 'react';
import { useClipboard } from '../utility/useClipboard.js';
import { useTimer } from '../utility/useTimer.js';

interface UseCopyActionOptions {
  fullFormatted: string;
  liveRef?: RefObject<HTMLElement | null>;
  onCopy?: (value: string) => void;
}

const DELAY = 1_800;

export function useCopyAction({ liveRef, fullFormatted, onCopy }: UseCopyActionOptions) {
  const liveTimer = useTimer();
  const { copied, copy } = useClipboard(DELAY);

  const copyAriaLabel = copied ? 'Copied' : `Copy ${fullFormatted}`;
  const copyButtonTitle = copied ? 'Copied' : 'Copy phone number';

  const onCopyClick = async () => {
    const valueToCopy = fullFormatted.trim();
    const success = await copy(valueToCopy);
    if (success) {
      onCopy?.(valueToCopy);
      if (liveRef?.current) {
        liveRef.current.textContent = 'Phone number copied to clipboard';
        liveTimer.set(() => {
          if (liveRef.current) liveRef.current.textContent = '';
        }, DELAY);
      }
    }
  };

  return {
    copied,
    copyAriaLabel,
    copyButtonTitle,
    onCopyClick
  };
}
