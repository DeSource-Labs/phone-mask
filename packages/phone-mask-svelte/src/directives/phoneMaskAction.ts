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

import type { PhoneMaskBindingOptions, PhoneMaskBindingState, PhoneMaskBindingElement } from '../types';

function parseParams(params: string | PhoneMaskBindingOptions | undefined): PhoneMaskBindingOptions {
  if (typeof params === 'string') return { country: params };
  if (params && typeof params === 'object') return params;
  return {};
}

/** Update the state digits and input's display value and trigger onChange callback */
function updateDigits(el: HTMLInputElement, state: PhoneMaskBindingState, digits: string) {
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

function checkDigitsUpdate(el: HTMLInputElement, state: PhoneMaskBindingState) {
  const maxDigits = state.formatter.getMaxDigits();
  const digits = extractDigits(el.value, maxDigits);
  const displayValue = state.formatter.formatDisplay(digits);

  if (digits !== state.digits || el.value !== displayValue) {
    updateDigits(el, state, digits);
  }
}

function checkCountryUpdate(state: PhoneMaskBindingState) {
  const oldCountry = state.country.id;
  const newCountry = state.options.country;

  if (newCountry && newCountry !== oldCountry) {
    state.setCountry(newCountry);
  }
}

function createHandler<T>(
  el: HTMLInputElement,
  state: PhoneMaskBindingState,
  handler: (e: T, state: PhoneMaskBindingState) => { newDigits: string; caretDigitIndex: number } | undefined
): (e: T) => void {
  return (e: T) => {
    const result = handler(e, state);
    if (!result) return;

    updateDigits(el, state, result.newDigits);

    Promise.resolve().then(() => {
      const pos = state.formatter.getCaretPosition(result.caretDigitIndex);
      setCaret(el, pos);
    });
  };
}

async function detectInitialCountry(options: PhoneMaskBindingOptions): Promise<string> {
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
 * Svelte action that applies phone number masking to an <input> element.
 *
 * Usage:
 *   <input use:phoneMaskAction="US" />
 *   <input use:phoneMaskAction={{ country, onChange, onCountryChange }} />
 *   <input use:phoneMaskAction={{ detect: true, onCountryChange: (c) => console.log(c) }} />
 *
 * Unlike {@attach phoneMaskAttachment(...)}, this works in all Svelte 5 versions
 * (not just 5.29+). Reactive changes are picked up via the `update()` hook
 * when the bound value changes.
 */
export function phoneMaskAction(
  el: HTMLInputElement,
  params?: string | PhoneMaskBindingOptions
): { update: (newParams?: string | PhoneMaskBindingOptions) => void; destroy: () => void } {
  if (el.tagName !== 'INPUT') {
    console.warn('[phoneMaskAction] Action can only be used on input elements');
    return {
      update() {},
      destroy() {}
    };
  }

  el.setAttribute('type', 'tel');
  el.setAttribute('inputmode', 'tel');
  el.setAttribute('placeholder', '');

  const options = parseParams(params);
  const locale = options.locale || getNavigatorLang();
  const country = getCountry(parseCountryCode(options.country, 'US'), locale);

  const state: PhoneMaskBindingState = {
    country,
    formatter: createPhoneFormatter(country),
    digits: '',
    locale,
    options,
    setCountry(code: string) {
      const parsed = parseCountryCode(code);

      if (!parsed) return false;

      const newCountry = getCountry(parsed, this.locale);

      this.country = newCountry;
      this.options.onCountryChange?.(newCountry);

      this.formatter = createPhoneFormatter(newCountry);
      el.placeholder = this.formatter.getPlaceholder();

      checkDigitsUpdate(el, this);

      return true;
    }
  };

  (el as PhoneMaskBindingElement).__phoneMaskState = state;

  const inputHandler = createHandler(el, state, processInput);
  const keydownHandler = createHandler(el, state, processKeydown);
  const pasteHandler = createHandler(el, state, processPaste);

  el.addEventListener('beforeinput', processBeforeInput);
  el.addEventListener('input', inputHandler);
  el.addEventListener('keydown', keydownHandler);
  el.addEventListener('paste', pasteHandler);

  detectInitialCountry(options).then((countryCode) => state.setCountry(countryCode));

  return {
    update(newParams?: string | PhoneMaskBindingOptions) {
      // Always update options to ensure callbacks are current
      state.options = parseParams(newParams);
      // Check if country changed and update if needed
      checkCountryUpdate(state);
      // Check if element value changed externally
      checkDigitsUpdate(el, state);
    },

    destroy() {
      el.removeEventListener('beforeinput', processBeforeInput);
      el.removeEventListener('input', inputHandler);
      el.removeEventListener('keydown', keydownHandler);
      el.removeEventListener('paste', pasteHandler);
      delete (el as PhoneMaskBindingElement).__phoneMaskState;
    }
  };
}
