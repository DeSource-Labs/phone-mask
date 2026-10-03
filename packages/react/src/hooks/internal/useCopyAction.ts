import { useCallback, type RefObject } from 'react';
import { useClipboard } from '../utility/useClipboard';
import { useTimer } from '../utility/useTimer';

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

  const announceToScreenReader = useCallback(
    (message: string) => {
      if (!liveRef?.current) return;
      liveRef.current.textContent = message;
      liveTimer.set(() => {
        if (liveRef.current) liveRef.current.textContent = '';
      }, DELAY);
    },
    [liveRef, liveTimer]
  );

  const onCopyClick = useCallback(async () => {
    const valueToCopy = fullFormatted.trim();
    const success = await copy(valueToCopy);
    if (success) {
      onCopy?.(valueToCopy);
      announceToScreenReader('Phone number copied to clipboard');
    }
  }, [fullFormatted, copy, onCopy, announceToScreenReader]);

  return {
    copied,
    copyAriaLabel,
    copyButtonTitle,
    onCopyClick
  };
}
