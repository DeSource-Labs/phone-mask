import { onDestroy } from 'svelte';

/**
 * Utility for managing timers with automatic cleanup on component destroy.
 */
export function useTimer() {
  let timerRef: ReturnType<typeof setTimeout> | null = null;

  const clear = () => {
    if (timerRef) {
      clearTimeout(timerRef);
      timerRef = null;
    }
  };

  const set = (callback: () => void, delay: number) => {
    clear();
    timerRef = setTimeout(callback, delay);
  };

  // Auto cleanup on destroy
  onDestroy(clear);

  return { set, clear };
}
