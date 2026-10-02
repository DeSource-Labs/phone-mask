import { useTimer } from '../utility/useTimer.svelte';

export function useValidationHint() {
  let showValidationHint = $state(false);

  const validationTimer = useTimer();

  const clearValidationHint = (hideHint = true) => {
    if (hideHint) showValidationHint = false;
    validationTimer.clear();
  };

  const scheduleValidationHint = (delay: number) => {
    showValidationHint = false;
    validationTimer.set(() => {
      showValidationHint = true;
    }, delay);
  };

  return {
    get showValidationHint() {
      return showValidationHint;
    },
    clearValidationHint,
    scheduleValidationHint
  };
}
