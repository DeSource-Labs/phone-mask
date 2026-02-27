import { useState, useCallback } from 'react';
import { useTimer } from '../utility/useTimer';

export function useValidationHint() {
  const [showValidationHint, setShowValidationHint] = useState(false);

  const validationTimer = useTimer();

  const clearValidationHint = useCallback(
    (hideHint = true) => {
      if (hideHint) setShowValidationHint(false);
      validationTimer.clear();
    },
    [validationTimer]
  );

  const scheduleValidationHint = useCallback(
    (delay: number) => {
      setShowValidationHint(false);
      validationTimer.set(() => {
        setShowValidationHint(true);
      }, delay);
    },
    [validationTimer]
  );

  return { showValidationHint, clearValidationHint, scheduleValidationHint };
}
