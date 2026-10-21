import { DestroyRef, inject } from '@angular/core';

export function useTimer() {
  const destroyRef = inject(DestroyRef);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;

  const clear = () => {
    clearTimeout(timer);
    timer = undefined;
  };

  const set = (callback: () => void, delay: number) => {
    clear();
    if (!destroyed) timer = setTimeout(callback, delay);
  };

  destroyRef.onDestroy(() => {
    destroyed = true;
    clear();
  });
  return { set, clear };
}
