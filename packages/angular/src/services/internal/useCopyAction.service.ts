import { computed } from '@angular/core';
import type { MaybeGetter } from '../../types';
import { readOption } from '../utility/readOption';
import { useClipboard } from '../utility/useClipboard.service';
import { useTimer } from '../utility/useTimer.service';

interface UseCopyActionOptions {
  fullFormatted: MaybeGetter<string>;
  liveRef?: () => HTMLElement | null;
  onCopy?: (value: string) => void;
}

export function useCopyAction({ fullFormatted, liveRef, onCopy }: UseCopyActionOptions) {
  const timer = useTimer();
  const { copied, copy } = useClipboard();
  const copyAriaLabel = computed(() => (copied() ? 'Copied' : `Copy ${readOption(fullFormatted)}`));
  const copyButtonTitle = computed(() => (copied() ? 'Copied' : 'Copy phone number'));

  const onCopyClick = async () => {
    const value = readOption(fullFormatted).trim();
    if (!(await copy(value))) return;
    onCopy?.(value);
    const live = liveRef?.();
    if (!live) return;
    live.textContent = 'Phone number copied to clipboard';
    timer.set(() => (live.textContent = ''), 1_800);
  };

  return { copied, copyAriaLabel, copyButtonTitle, onCopyClick };
}
