import { useFormatter } from './internal/useFormatter.svelte';
import { useCountry } from './internal/useCountry.svelte';
import { useInputHandlers } from './internal/useInputHandlers.svelte';
import type { UsePhoneMaskOptions } from '../types';

/**
 * Svelte composable for phone number masking.
 * Provides low-level phone masking functionality for custom input implementations.
 * Works in controlled mode — caller manages value state via onChange callback.
 *
 * ⚠️ **Do NOT destructure the returned object.**
 * All properties are reactive getters. Destructuring breaks reactivity:
 * ```ts
 * // ✅ Correct:
 * const phoneMask = usePhoneMask(options);
 * phoneMask.digits; // reactive
 *
 * // ❌ Wrong — loses reactivity:
 * const { digits } = usePhoneMask(options);
 * ```
 */
export function usePhoneMask(options: UsePhoneMaskOptions) {
  let inputRef = $state<HTMLInputElement | null>(null);

  // Keep as objects (no destructuring) to preserve reactive getter chains
  const countryData = useCountry({
    country: options.country,
    locale: options.locale,
    detect: options.detect,
    onCountryChange: options.onCountryChange
  });

  const formatterData = useFormatter({
    country: () => countryData.country,
    value: options.value,
    onChange: options.onChange,
    onPhoneChange: options.onPhoneChange
  });

  const { handleBeforeInput, handleInput, handleKeydown, handlePaste } = useInputHandlers({
    formatter: () => formatterData.formatter,
    digits: () => formatterData.digits,
    onChange: options.onChange
  });

  // Attach event listeners reactively — re-runs if inputRef changes, cleans up automatically
  $effect(() => {
    const el = inputRef;
    if (!el) return;
    el.setAttribute('type', 'tel');
    el.setAttribute('inputmode', 'tel');
    el.addEventListener('beforeinput', handleBeforeInput as EventListener);
    el.addEventListener('input', handleInput);
    el.addEventListener('keydown', handleKeydown as EventListener);
    el.addEventListener('paste', handlePaste as EventListener);
    return () => {
      el.removeEventListener('beforeinput', handleBeforeInput as EventListener);
      el.removeEventListener('input', handleInput);
      el.removeEventListener('keydown', handleKeydown as EventListener);
      el.removeEventListener('paste', handlePaste as EventListener);
    };
  });

  // Update display value and placeholder reactively after DOM is ready
  // $effect runs after DOM updates by default (equivalent to Vue's flush: 'post')
  $effect(() => {
    const el = inputRef;
    if (!el) return;
    el.value = formatterData.displayValue;
    el.setAttribute('placeholder', formatterData.displayPlaceholder);
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
      return formatterData.digits;
    },
    get formatter() {
      return formatterData.formatter;
    },
    get full() {
      return formatterData.full;
    },
    get fullFormatted() {
      return formatterData.fullFormatted;
    },
    get isComplete() {
      return formatterData.isComplete;
    },
    get isEmpty() {
      return formatterData.isEmpty;
    },
    get shouldShowWarn() {
      return formatterData.shouldShowWarn;
    },
    get country() {
      return countryData.country;
    },
    get locale() {
      return countryData.locale;
    },
    setCountry: countryData.setCountry,
    clear
  };
}
