import { onUnmounted } from 'vue';

/** Composable for managing timers with automatic cleanup */
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

  // Auto cleanup on unmount
  onUnmounted(clear);

  return { set, clear };
}
