import { signal } from '@angular/core';
import { useTimer } from '../utility/useTimer.service';

export function useValidationHint() {
  const showValidationHint = signal(false);
  const timer = useTimer();

  const clearValidationHint = (hideHint = true) => {
    if (hideHint) showValidationHint.set(false);
    timer.clear();
  };

  const scheduleValidationHint = (delay: number) => {
    showValidationHint.set(false);
    timer.set(() => showValidationHint.set(true), delay);
  };

  return { showValidationHint: showValidationHint.asReadonly(), clearValidationHint, scheduleValidationHint };
}
