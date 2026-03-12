import { shallowRef, watchEffect, onMounted, onUnmounted } from 'vue';
import type { ShallowRef } from 'vue';
import { useFormatter } from './internal/useFormatter';
import { useCountry } from './internal/useCountry';
import { useInputHandlers } from './internal/useInputHandlers';
import type { UsePhoneMaskOptions, UsePhoneMaskReturn } from '../types';

/**
 * Vue composable for phone number masking.
 * Provides low-level phone masking functionality for custom input implementations.
 * Works in controlled mode — caller manages value state via onChange callback.
 */
export function usePhoneMask(options: UsePhoneMaskOptions): UsePhoneMaskReturn {
  const inputRef: ShallowRef<HTMLInputElement | null> = shallowRef(null);

  const { country, setCountry } = useCountry({
    country: options.country,
    locale: options.locale,
    detect: options.detect,
    onCountryChange: options.onCountryChange
  });

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
