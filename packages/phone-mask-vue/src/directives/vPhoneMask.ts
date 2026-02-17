import { type Directive, type DirectiveBinding, nextTick } from 'vue';
import {
  getNavigatorLang,
  getCountry,
  detectCountryFromGeoIP,
  detectCountryFromLocale,
  setCaret,
  extractDigits,
  processBeforeInput,
  processInput,
  processKeydown,
  processPaste,
  createPhoneFormatter,
  type MaskFull
} from '@desource/phone-mask';

import type { PMaskDirectiveOptions, PMaskDirectiveState, DirectiveHTMLInputElement } from '../types';

/**
 * Initialize directive state from binding value.
 * Determines country through explicit setting, detection, or default
 */
async function initState(binding: DirectiveBinding): Promise<PMaskDirectiveState> {
  const value = binding.value;
  let options: PMaskDirectiveOptions = {};

  // Parse binding value
  if (typeof value === 'string') {
    options = { country: value };
  } else if (typeof value === 'object' && value !== null) {
    options = value;
  }

  const locale = options.locale || getNavigatorLang();
  let country: MaskFull;

  // Determine country
  if (options.country) {
    country = getCountry(options.country, locale);
  } else if (options.detect) {
    const geoCountry = await detectCountryFromGeoIP();
    if (geoCountry) {
      country = getCountry(geoCountry, locale);
    } else {
      const localeCountry = detectCountryFromLocale();
      if (localeCountry) {
        country = getCountry(localeCountry, locale);
      } else {
        country = getCountry('US', locale);
      }
    }
  } else {
    country = getCountry('US', locale);
  }

  return {
    country,
    formatter: createPhoneFormatter(country),
    digits: '',
    locale,
    options
  };
}

/** Update the input's display value and trigger onChange callback */
function updateDisplay(el: HTMLInputElement, state: PMaskDirectiveState): void {
  el.value = state.formatter.formatDisplay(state.digits);

  // Trigger onChange callback
  if (state.options.onChange) {
    const fullNumberFormatted = `${state.country.code} ${el.value}`;
    const fullNumber = `${state.country.code}${state.digits}`;
    state.options.onChange({
      full: fullNumber,
      fullFormatted: fullNumberFormatted,
      digits: state.digits
    });
  }
}

/**
 * Create input event handler.
 * Extracts digits from typed input, formats display, and positions cursor
 */
function createInputHandler(el: HTMLInputElement, state: PMaskDirectiveState): (e: Event) => void {
  return (e: Event) => {
    const result = processInput(e, { formatter: state.formatter });
    if (!result) return;

    state.digits = result.newDigits;
    updateDisplay(el, state);

    nextTick(() => {
      const pos = state.formatter.getCaretPosition(result.caretDigitIndex);
      setCaret(el, pos);
    });
  };
}

/**
 * Create keydown event handler.
 * Handles backspace, delete, and navigation keys.
 * Intelligently skips delimiters during deletion
 */
function createKeydownHandler(el: HTMLInputElement, state: PMaskDirectiveState): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    const result = processKeydown(e, {
      digits: state.digits,
      formatter: state.formatter
    });

    if (!result) return;

    state.digits = result.newDigits;
    updateDisplay(el, state);

    nextTick(() => {
      const pos = state.formatter.getCaretPosition(result.caretDigitIndex);
      setCaret(el, pos);
    });
  };
}

/**
 * Create paste event handler.
 * Extracts digits from pasted content and intelligently inserts them
 */
function createPasteHandler(el: HTMLInputElement, state: PMaskDirectiveState): (e: ClipboardEvent) => void {
  return (e: ClipboardEvent) => {
    const result = processPaste(e, {
      digits: state.digits,
      formatter: state.formatter
    });

    if (!result) return;

    state.digits = result.newDigits;
    updateDisplay(el, state);

    nextTick(() => {
      const pos = state.formatter.getCaretPosition(result.caretDigitIndex);
      setCaret(el, pos);
    });
  };
}

/**
 * Update country and reformat existing input.
 * Updates formatter, placeholder, truncates digits if needed, and triggers callbacks
 */
async function updateCountry(el: HTMLInputElement, state: PMaskDirectiveState, newCountryCode: string): Promise<void> {
  const newCountry = getCountry(newCountryCode, state.locale);
  state.country = newCountry;
  state.formatter = createPhoneFormatter(newCountry);

  // Update placeholder
  el.placeholder = state.formatter.getPlaceholder();

  // Truncate digits if needed
  const maxDigits = state.formatter.getMaxDigits();
  if (state.digits.length > maxDigits) {
    state.digits = state.digits.slice(0, maxDigits);
  }

  updateDisplay(el, state);

  if (state.options.onCountryChange) {
    state.options.onCountryChange(newCountry);
  }
}

export const vPhoneMask: Directive<DirectiveHTMLInputElement, string | PMaskDirectiveOptions | undefined> = {
  async mounted(el, binding) {
    // Ensure it's an input element
    if (el.tagName !== 'INPUT') {
      console.warn('[v-phone-mask] Directive can only be used on input elements');
      return;
    }
    // Set input attributes
    el.setAttribute('type', 'tel');
    el.setAttribute('inputmode', 'tel');

    // Initialize state
    const state = await initState(binding);
    el.__phoneMaskState = state;

    // Create and attach handlers
    state.inputHandler = createInputHandler(el, state);
    state.keydownHandler = createKeydownHandler(el, state);
    state.pasteHandler = createPasteHandler(el, state);
    state.beforeInputHandler = processBeforeInput;

    el.addEventListener('beforeinput', state.beforeInputHandler);
    el.addEventListener('input', state.inputHandler);
    el.addEventListener('keydown', state.keydownHandler);
    el.addEventListener('paste', state.pasteHandler);

    // Set initial placeholder
    el.setAttribute('placeholder', state.formatter.getPlaceholder());
    // Trigger initial country change callback
    if (state.options.onCountryChange) {
      state.options.onCountryChange(state.country);
    }
    // Parse existing value
    if (el.value) {
      const maxDigits = state.formatter.getMaxDigits();
      state.digits = extractDigits(el.value, maxDigits);
      updateDisplay(el, state);
    }
  },

  async updated(el, binding) {
    const state = el.__phoneMaskState;
    if (!state) return;

    const value = binding.value;
    let newOptions: PMaskDirectiveOptions = {};

    if (typeof value === 'string') {
      newOptions = { country: value };
    } else if (typeof value === 'object' && value !== null) {
      newOptions = value;
    }

    // Always update options to ensure callbacks are current
    const oldCountry = state.options.country;
    state.options = newOptions;

    // Check if country changed and update if needed
    const newCountry = newOptions.country;
    if (newCountry && newCountry !== oldCountry) {
      await updateCountry(el, state, newCountry);
    }

    // Check if element value changed externally
    const newDigits = extractDigits(el.value);
    if (newDigits !== state.digits) {
      state.digits = newDigits;
      updateDisplay(el, state);
    }
  },

  unmounted(el) {
    const state = el.__phoneMaskState;
    if (!state) return;

    // Remove event listeners
    if (state.beforeInputHandler) el.removeEventListener('beforeinput', state.beforeInputHandler);
    if (state.inputHandler) el.removeEventListener('input', state.inputHandler);
    if (state.keydownHandler) el.removeEventListener('keydown', state.keydownHandler);
    if (state.pasteHandler) el.removeEventListener('paste', state.pasteHandler);

    // Clean up
    delete el.__phoneMaskState;
  }
};

// Export helper for programmatic access
export { updateCountry as setCountry };
