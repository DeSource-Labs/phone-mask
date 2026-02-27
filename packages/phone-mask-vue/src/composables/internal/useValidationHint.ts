import { ref } from 'vue';
import { useTimer } from '../utility/useTimer';

export function useValidationHint() {
  const showValidationHint = ref(false);

  const validationTimer = useTimer();

  const clearValidationHint = (hideHint = true) => {
    if (hideHint) showValidationHint.value = false;
    validationTimer.clear();
  };

  const scheduleValidationHint = (delay: number) => {
    showValidationHint.value = false;
    validationTimer.set(() => {
      showValidationHint.value = true;
    }, delay);
  };

  return { showValidationHint, clearValidationHint, scheduleValidationHint };
}
