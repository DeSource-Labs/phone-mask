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

import type { PhoneMaskActionOptions, PhoneMaskActionState, PhoneMaskActionElement } from '../types';

function parseParams(params: string | PhoneMaskActionOptions | undefined): PhoneMaskActionOptions {
  if (typeof params === 'string') return { country: params };
  if (params && typeof params === 'object') return params;
  return {};
}

function updateDisplay(el: HTMLInputElement, state: PhoneMaskActionState): void {
  el.value = state.formatter.formatDisplay(state.digits);

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

function createInputHandler(el: HTMLInputElement, state: PhoneMaskActionState): (e: Event) => void {
  return (e: Event) => {
    const result = processInput(e, { formatter: state.formatter });
    if (!result) return;

    state.digits = result.newDigits;
    updateDisplay(el, state);

    Promise.resolve().then(() => {
      const pos = state.formatter.getCaretPosition(result.caretDigitIndex);
      setCaret(el, pos);
    });
  };
}

function createKeydownHandler(el: HTMLInputElement, state: PhoneMaskActionState): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    const result = processKeydown(e, {
      digits: state.digits,
      formatter: state.formatter
    });

    if (!result) return;

    state.digits = result.newDigits;
    updateDisplay(el, state);

    Promise.resolve().then(() => {
      const pos = state.formatter.getCaretPosition(result.caretDigitIndex);
      setCaret(el, pos);
    });
  };
}

function createPasteHandler(el: HTMLInputElement, state: PhoneMaskActionState): (e: ClipboardEvent) => void {
  return (e: ClipboardEvent) => {
    const result = processPaste(e, {
      digits: state.digits,
      formatter: state.formatter
    });

    if (!result) return;

    state.digits = result.newDigits;
    updateDisplay(el, state);

    Promise.resolve().then(() => {
      const pos = state.formatter.getCaretPosition(result.caretDigitIndex);
      setCaret(el, pos);
    });
  };
}

/**
 * Svelte action that applies phone number masking to an <input> element.
 *
 * Usage:
 *   <input use:phoneMaskAction="US" />
 *   <input use:phoneMaskAction={{ country, onChange, onCountryChange }} />
 *   <input use:phoneMaskAction={{ detect: true, onCountryChange: (c) => console.log(c) }} />
 *
 * Unlike {@attach phoneMask(...)}, this works in all Svelte 5 versions
 * (not just 5.29+). Reactive changes are picked up via the `update()` hook
 * when the bound value changes.
 */
export function phoneMaskAction(
  el: HTMLInputElement,
  params?: string | PhoneMaskActionOptions
): { update: (newParams?: string | PhoneMaskActionOptions) => void; destroy: () => void } {
  if (el.tagName !== 'INPUT') {
    console.warn('[phoneMaskAction] Action can only be used on input elements');
    return {
      update() {},
      destroy() {}
    };
  }

  el.setAttribute('type', 'tel');
  el.setAttribute('inputmode', 'tel');

  const options = parseParams(params);
  const locale = options.locale || getNavigatorLang();
  const country = getCountry(parseCountryCode(options.country, 'US'), locale);

  const state: PhoneMaskActionState = {
    country,
    formatter: createPhoneFormatter(country),
    digits: '',
    locale,
    options,
    setCountry(code: string) {
      const newCountry = getCountry(code, state.locale);
      state.country = newCountry;
      state.formatter = createPhoneFormatter(newCountry);
      el.placeholder = state.formatter.getPlaceholder();
      const maxDigits = state.formatter.getMaxDigits();
      state.digits = extractDigits(state.digits, maxDigits);
      updateDisplay(el, state);
      if (state.options.onCountryChange) {
        state.options.onCountryChange(newCountry);
      }
      return true;
    }
  };

  const inputHandler = createInputHandler(el, state);
  const keydownHandler = createKeydownHandler(el, state);
  const pasteHandler = createPasteHandler(el, state);

  el.addEventListener('beforeinput', processBeforeInput);
  el.addEventListener('input', inputHandler);
  el.addEventListener('keydown', keydownHandler);
  el.addEventListener('paste', pasteHandler);

  el.setAttribute('placeholder', state.formatter.getPlaceholder());

  if (state.options.onCountryChange) {
    state.options.onCountryChange(state.country);
  }

  if (el.value) {
    const maxDigits = state.formatter.getMaxDigits();
    state.digits = extractDigits(el.value, maxDigits);
    updateDisplay(el, state);
  }

  (el as PhoneMaskActionElement).__phoneMaskActionState = state;

  // Async GeoIP detection — updates state after mount
  if (options.detect) {
    detectByGeoIp().then((geoCode) => {
      const code = parseCountryCode(geoCode);
      if (code) {
        state.setCountry(code);
      } else {
        const localeCode = parseCountryCode(detectCountryFromLocale());
        if (localeCode) state.setCountry(localeCode);
      }
    });
  }

  return {
    update(newParams?: string | PhoneMaskActionOptions) {
      const newOptions = parseParams(newParams);
      const oldCountry = state.options.country;
      state.options = newOptions;

      if (newOptions.country && newOptions.country !== oldCountry) {
        state.setCountry(newOptions.country);
      }

      // Sync externally changed value
      const maxDigits = state.formatter.getMaxDigits();
      const newDigits = extractDigits(el.value, maxDigits);
      const normalizedDisplay = state.formatter.formatDisplay(newDigits);
      if (newDigits !== state.digits || el.value !== normalizedDisplay) {
        state.digits = newDigits;
        updateDisplay(el, state);
      }
    },

    destroy() {
      el.removeEventListener('beforeinput', processBeforeInput);
      el.removeEventListener('input', inputHandler);
      el.removeEventListener('keydown', keydownHandler);
      el.removeEventListener('paste', pasteHandler);
      delete (el as PhoneMaskActionElement).__phoneMaskActionState;
    }
  };
}

/**
 * Programmatically switch the country on an element with the phoneMaskAction mounted.
 * Returns true if applied successfully, false if the element has no active action state.
 */
export function phoneMaskActionSetCountry(el: HTMLInputElement, code: string): boolean {
  const state = (el as PhoneMaskActionElement).__phoneMaskActionState;
  if (!state) return false;
  try {
    return state.setCountry(code);
  } catch {
    return false;
  }
}
