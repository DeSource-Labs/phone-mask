import { onMount, onDestroy } from 'svelte';
import { useFormatter } from './internal/useFormatter.svelte';
import { useCountry } from './internal/useCountry.svelte';
import { useInputHandlers } from './internal/useInputHandlers.svelte';
import type { UsePhoneMaskOptions } from '../types';

/**
 * Svelte composable for phone number masking.
 * Provides low-level phone masking functionality for custom input implementations.
 * Works in controlled mode — caller manages value state via onChange callback.
 */
export function usePhoneMask(options: UsePhoneMaskOptions) {
  let inputRef = $state<HTMLInputElement | null>(null);

  const { country, setCountry, locale } = useCountry({
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
    country: () => country,
    value: options.value,
    onChange: options.onChange,
    onPhoneChange: options.onPhoneChange
  });

  const { handleBeforeInput, handleInput, handleKeydown, handlePaste } = useInputHandlers({
    formatter: () => formatter,
    digits: () => digits,
    onChange: options.onChange
  });

  // Set input type on mount for better mobile UX and attach event listeners
  onMount(() => {
    const el = inputRef;
    if (!el) return;
    el.setAttribute('type', 'tel');
    el.setAttribute('inputmode', 'tel');
    el.addEventListener('beforeinput', handleBeforeInput as EventListener);
    el.addEventListener('input', handleInput);
    el.addEventListener('keydown', handleKeydown as EventListener);
    el.addEventListener('paste', handlePaste as EventListener);
  });

  // Update display value and placeholder reactively after DOM is ready
  // $effect runs after DOM updates by default (equivalent to Vue's flush: 'post')
  $effect(() => {
    const el = inputRef;
    if (!el) return;
    el.value = displayValue;
    el.setAttribute('placeholder', displayPlaceholder);
  });

  // Clean up event listeners on destroy
  onDestroy(() => {
    const el = inputRef;
    if (!el) return;
    el.removeEventListener('beforeinput', handleBeforeInput as EventListener);
    el.removeEventListener('input', handleInput);
    el.removeEventListener('keydown', handleKeydown as EventListener);
    el.removeEventListener('paste', handlePaste as EventListener);
  });

  const clear = () => {
    options.onChange('');
  };

  return {
    get inputRef() {
      return inputRef;
    },
    set inputRef(el: HTMLInputElement | null) {
      inputRef = el;
    },
    get digits() {
      return digits;
    },
    get full() {
      return full;
    },
    get fullFormatted() {
      return fullFormatted;
    },
    get isComplete() {
      return isComplete;
    },
    get isEmpty() {
      return isEmpty;
    },
    get shouldShowWarn() {
      return shouldShowWarn;
    },
    get country() {
      return country;
    },
    get locale() {
      return locale;
    },
    setCountry,
    clear
  };
}
