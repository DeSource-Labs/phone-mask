import { useRef, useCallback, useEffect, useMemo } from 'react';

/**
 * Custom hook for managing timers with automatic cleanup
 * @returns Object with set and clear methods for timer control
 */
export function useTimer() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const set = useCallback(
    (callback: () => void, delay: number) => {
      clear();
      timerRef.current = setTimeout(callback, delay);
    },
    [clear]
  );

  // Auto cleanup on unmount
  useEffect(() => {
    return clear;
  }, [clear]);

  return useMemo(() => ({ set, clear }), [set, clear]);
}
