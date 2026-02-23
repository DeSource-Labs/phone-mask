// Mask/digits formatting and input handling
import { ref, computed } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { MaskFull } from '@desource/phone-mask';
import { useTimer } from './useTimer';
import { useInputHandlers } from './useInputHandlers';
import { useFormatter } from './useFormatter';

import type { PhoneNumber } from '../types';

interface UseMaskOptions {
  value: MaybeRefOrGetter<string>;
  country: MaybeRefOrGetter<MaskFull>;
  onChange: (newDigits: string) => void;
  onPhoneChange?: (data: PhoneNumber) => void;
  onValidationChange?: (isComplete: boolean) => void;
}

export function useMask({ value, country, onChange, onPhoneChange, onValidationChange }: UseMaskOptions) {
  const showValidationHint = ref(false);

  const { formatter, digits, displayPlaceholder, displayValue, isComplete, isEmpty, full, fullFormatted } =
    useFormatter({
      value,
      country,
      onChange,
      onPhoneChange,
      onValidationChange
    });

  // Override shouldShowWarn with timer-based validation hint
  const shouldShowWarn = computed(() => showValidationHint.value && !isEmpty.value && !isComplete.value);

  const validationTimer = useTimer();

  /** Reset hint, cancel previous timer and schedule a new one */
  const scheduleValidationHint = (delay: number) => {
    showValidationHint.value = false;
    validationTimer.set(() => {
      if (!isComplete.value && !isEmpty.value) showValidationHint.value = true;
    }, delay);
  };

  const { handleBeforeInput, handleInput, handleKeydown, handlePaste } = useInputHandlers({
    formatter,
    digits,
    onChange,
    scheduleValidationHint
  });

  const handleFocus = () => {
    // Do not hide the hint on focus; keep it visible if already shown
    validationTimer.clear();
  };

  /** Clear/reset function */
  const clear = () => {
    onChange('');
    showValidationHint.value = false;
    validationTimer.clear();
  };

  return {
    // Computed
    digits,
    displayPlaceholder,
    displayValue,
    isComplete,
    isEmpty,
    shouldShowWarn,
    fullFormatted,
    full,

    // Handlers
    handleBeforeInput,
    handleInput,
    handleKeydown,
    handlePaste,
    handleFocus,

    // Methods
    clear
  };
}
