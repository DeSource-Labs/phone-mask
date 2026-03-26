import { type Directive, nextTick } from 'vue';
import {
  getNavigatorLang,
  getCountry,
  parseCountryCode,
  detectByGeoIp,
  detectCountryFromLocale,
  setCaret,
  extractDigits,
  processBeforeInput,
  processInput,
  processKeydown,
  processPaste,
  createPhoneFormatter
} from '@desource/phone-mask';
import type { PMaskDirectiveOptions, PMaskDirectiveState, DirectiveHTMLInputElement } from '../types';

function parseParams(params: string | PMaskDirectiveOptions | undefined): PMaskDirectiveOptions {
  if (typeof params === 'string') return { country: params };
  if (params && typeof params === 'object') return params;
  return {};
}

/** Update the state digits and input's display value and trigger onChange callback */
function updateDigits(el: HTMLInputElement, state: PMaskDirectiveState, digits: string) {
  state.digits = digits;
  el.value = state.formatter.formatDisplay(state.digits);

  // Trigger onChange callback
  if (state.options.onChange) {
    const fullNumberFormatted = el.value ? `${state.country.code} ${el.value}` : '';
    const fullNumber = state.digits ? `${state.country.code}${state.digits}` : '';

    state.options.onChange({
      full: fullNumber,
      fullFormatted: fullNumberFormatted,
      digits: state.digits
    });
  }
}

function checkDigitsUpdate(el: HTMLInputElement, state: PMaskDirectiveState) {
  const maxDigits = state.formatter.getMaxDigits();
  const digits = extractDigits(el.value, maxDigits);
  const displayValue = state.formatter.formatDisplay(digits);

  if (digits !== state.digits || el.value !== displayValue) {
    updateDigits(el, state, digits);
  }
}

function checkCountryUpdate(el: HTMLInputElement, state: PMaskDirectiveState) {
  const oldCountry = state.country.id;
  const newCountry = parseCountryCode(state.options.country);

  if (newCountry && newCountry !== oldCountry) {
    setCountry(el, state, newCountry);
  }
}

function createHandler<T>(
  el: HTMLInputElement,
  state: PMaskDirectiveState,
  handler: (e: T, state: PMaskDirectiveState) => { newDigits: string; caretDigitIndex: number } | undefined
): (e: T) => void {
  return (e: T) => {
    const result = handler(e, state);
    if (!result) return;

    updateDigits(el, state, result.newDigits);

    nextTick(() => {
      const pos = state.formatter.getCaretPosition(result.caretDigitIndex);
      setCaret(el, pos);
    });
  };
}

async function detectInitialCountry(options: PMaskDirectiveOptions): Promise<string> {
  const countryOption = parseCountryCode(options.country);

  if (countryOption) return countryOption;

  if (options.detect) {
    const geoCountry = parseCountryCode(await detectByGeoIp());

    if (geoCountry) return geoCountry;

    const localeCountry = parseCountryCode(detectCountryFromLocale());

    if (localeCountry) return localeCountry;
  }

  return 'US';
}

/**
 * Update country and reformat existing input.
 * Updates formatter, placeholder, truncates digits if needed, and triggers callbacks
 */
export function setCountry(el: HTMLInputElement, state: PMaskDirectiveState, newCountryCode: string): void {
  const parsed = parseCountryCode(newCountryCode);

  if (!parsed) return;

  const newCountry = getCountry(parsed, state.locale);

  state.country = newCountry;
  state.options.onCountryChange?.(newCountry);

  state.formatter = createPhoneFormatter(newCountry);
  el.placeholder = state.formatter.getPlaceholder();

  checkDigitsUpdate(el, state);
}

export const vPhoneMask: Directive<DirectiveHTMLInputElement, string | PMaskDirectiveOptions | undefined> = {
  mounted(el, binding) {
    // Ensure it's an input element
    if (el.tagName !== 'INPUT') {
      console.warn('[v-phone-mask] Directive can only be used on input elements');
      return;
    }

    el.setAttribute('type', 'tel');
    el.setAttribute('inputmode', 'tel');
    el.setAttribute('placeholder', '');

    const options = parseParams(binding.value);
    const locale = options.locale || getNavigatorLang();
    const country = getCountry(parseCountryCode(options.country, 'US'), locale);

    const state = {
      country,
      formatter: createPhoneFormatter(country),
      digits: '',
      locale,
      options
    } as PMaskDirectiveState;

    el.__phoneMaskState = state;

    // Create and attach handlers
    state.inputHandler = createHandler(el, state, processInput);
    state.keydownHandler = createHandler(el, state, processKeydown);
    state.pasteHandler = createHandler(el, state, processPaste);
    state.beforeInputHandler = processBeforeInput;

    el.addEventListener('beforeinput', state.beforeInputHandler);
    el.addEventListener('input', state.inputHandler);
    el.addEventListener('keydown', state.keydownHandler);
    el.addEventListener('paste', state.pasteHandler);
    // Update state with detected country & formatter, then run effects.
    detectInitialCountry(options).then((countryCode) => {
      // Guard against the directive being unmounted before the async detection resolves.
      if (el.__phoneMaskState !== state) return;
      setCountry(el, state, countryCode);
    });
  },

  updated(el, binding) {
    const state = el.__phoneMaskState;
    if (!state) return;
    // Always update options to ensure callbacks are current
    state.options = parseParams(binding.value);
    // Check if country changed and update if needed
    checkCountryUpdate(el, state);
    // Check if element value changed externally
    checkDigitsUpdate(el, state);
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
