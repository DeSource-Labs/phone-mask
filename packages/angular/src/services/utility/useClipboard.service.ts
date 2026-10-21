import { DestroyRef, inject, signal } from '@angular/core';
import { useTimer } from './useTimer.service';

export function useClipboard(delay = 1_800) {
  const destroyRef = inject(DestroyRef);
  const copied = signal(false);
  const isCopying = signal(false);
  const timer = useTimer();
  let destroyed = false;
  destroyRef.onDestroy(() => (destroyed = true));

  const copy = async (text: string): Promise<boolean> => {
    const trimmed = text.trim();
    if (destroyed || isCopying() || !trimmed) return false;
    isCopying.set(true);
    try {
      await navigator.clipboard.writeText(trimmed);
      if (destroyed) return false;
      copied.set(true);
      timer.set(() => copied.set(false), delay);
      return true;
    } catch (error) {
      console.warn('Copy failed', error);
      return false;
    } finally {
      isCopying.set(false);
    }
  };

  return { copied: copied.asReadonly(), isCopying: isCopying.asReadonly(), copy };
}
