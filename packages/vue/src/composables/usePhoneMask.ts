import { shallowRef, watchEffect, onMounted, onUnmounted, type ShallowRef } from 'vue';
import { useFormatter } from './internal/useFormatter.js';
import { useCountry } from './internal/useCountry.js';
import { useInputHandlers } from './internal/useInputHandlers.js';
import type { UsePhoneMaskOptions, UsePhoneMaskReturn } from '../types.js';

/**
 * Vue composable for phone number masking.
 * Provides low-level phone masking functionality for custom input implementations.
 * Works in controlled mode — caller manages value state via onChange callback.
 */
export function usePhoneMask(options: UsePhoneMaskOptions): UsePhoneMaskReturn {
  const inputRef: ShallowRef<HTMLInputElement | null> = shallowRef(null);

  const { country, setCountry, cancelDetection } = useCountry(options);

  const {
    digits,
    formatter,
    displayPlaceholder,
    displayValue,
    full,
    fullFormatted,
    isComplete,
    isEmpty,
    shouldShowWarn
  } = useFormatter({
    country,
    value: options.value,
    onChange: options.onChange,
    onPhoneChange: options.onPhoneChange
  });

  const { handleBeforeInput, handleInput, handleKeydown, handlePaste } = useInputHandlers({
    formatter,
    digits,
    onCountryChange: setCountry,
    onEdit: cancelDetection,
    onChange: options.onChange
  });

  // Set input type on mount for better mobile UX
  onMounted(() => {
    const el = inputRef.value;
    if (!el) return;
    el.setAttribute('type', 'tel');
    el.setAttribute('inputmode', 'tel');
  });

  // Update display value and placeholder reactively after DOM is ready
  watchEffect(
    () => {
      const el = inputRef.value;
      if (!el) return;
      el.value = displayValue.value;
      el.setAttribute('placeholder', displayPlaceholder.value);
    },
    { flush: 'post' }
  );

  // Attach native event listeners on mount, clean up on unmount
  onMounted(() => {
    const el = inputRef.value;
    if (!el) return;
    el.addEventListener('beforeinput', handleBeforeInput);
    el.addEventListener('input', handleInput);
    el.addEventListener('keydown', handleKeydown);
    el.addEventListener('paste', handlePaste);
  });

  onUnmounted(() => {
    const el = inputRef.value;
    if (!el) return;
    el.removeEventListener('beforeinput', handleBeforeInput);
    el.removeEventListener('input', handleInput);
    el.removeEventListener('keydown', handleKeydown);
    el.removeEventListener('paste', handlePaste);
  });

  const clear = () => {
    cancelDetection();
    options.onChange('');
  };

  return {
    inputRef,
    digits,
    formatter,
    full,
    fullFormatted,
    isComplete,
    isEmpty,
    shouldShowWarn,
    country,
    setCountry,
    clear
  };
}
