import { tick } from 'svelte';
import {
  getNavigatorLang,
  getCountry,
  detectByGeoIp,
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
import type { PhoneMaskActionOptions, PhoneMaskActionState, PhoneMaskActionElement } from '../types';

function parseParams(params: string | PhoneMaskActionOptions | undefined): PhoneMaskActionOptions {
  if (typeof params === 'string') return { country: params };
  if (params && typeof params === 'object') return params;
  return {};
}

async function resolveCountry(options: PhoneMaskActionOptions): Promise<MaskFull> {
  const locale = options.locale || getNavigatorLang();

  if (options.country) {
    return getCountry(options.country, locale);
  }

  if (options.detect) {
    try {
      const geoCountry = await detectByGeoIp();
      if (geoCountry) return getCountry(geoCountry, locale);
    } catch {
      // Network failure — fall through to locale detection
    }
    const localeCountry = detectCountryFromLocale();
    return getCountry(localeCountry || 'US', locale);
  }

  return getCountry('US', locale);
}

function updateDisplay(el: HTMLInputElement, state: PhoneMaskActionState): void {
  el.value = state.formatter.formatDisplay(state.digits);

  if (state.options.onChange) {
    state.options.onChange({
      full: state.digits ? `${state.country.code}${state.digits}` : '',
      fullFormatted: el.value ? `${state.country.code} ${el.value}` : '',
      digits: state.digits
    });
  }
}

function applyCountryChange(el: HTMLInputElement, state: PhoneMaskActionState, newCode: string): void {
  const newCountry = getCountry(newCode, state.locale);
  state.country = newCountry;
  state.formatter = createPhoneFormatter(newCountry);

  el.setAttribute('placeholder', state.formatter.getPlaceholder());

  const maxDigits = state.formatter.getMaxDigits();
  if (state.digits.length > maxDigits) {
    state.digits = state.digits.slice(0, maxDigits);
  }

  updateDisplay(el, state);

  if (state.options.onCountryChange) {
    state.options.onCountryChange(newCountry);
  }
}

function attachHandlers(el: HTMLInputElement, state: PhoneMaskActionState): void {
  state.beforeInputHandler = (e: InputEvent) => {
    processBeforeInput(e);
  };

  state.inputHandler = (e: Event) => {
    const result = processInput(e, { formatter: state.formatter });
    if (!result) return;
    state.digits = result.newDigits;
    updateDisplay(el, state);
    tick().then(() => {
      setCaret(el, state.formatter.getCaretPosition(result.caretDigitIndex));
    });
  };

  state.keydownHandler = (e: KeyboardEvent) => {
    const result = processKeydown(e, { digits: state.digits, formatter: state.formatter });
    if (!result) return;
    state.digits = result.newDigits;
    updateDisplay(el, state);
    tick().then(() => {
      setCaret(el, state.formatter.getCaretPosition(result.caretDigitIndex));
    });
  };

  state.pasteHandler = (e: ClipboardEvent) => {
    const result = processPaste(e, { digits: state.digits, formatter: state.formatter });
    if (!result) return;
    state.digits = result.newDigits;
    updateDisplay(el, state);
    tick().then(() => {
      setCaret(el, state.formatter.getCaretPosition(result.caretDigitIndex));
    });
  };

  el.addEventListener('beforeinput', state.beforeInputHandler);
  el.addEventListener('input', state.inputHandler);
  el.addEventListener('keydown', state.keydownHandler);
  el.addEventListener('paste', state.pasteHandler);
}

function detachHandlers(el: HTMLInputElement, state: PhoneMaskActionState): void {
  if (state.beforeInputHandler) el.removeEventListener('beforeinput', state.beforeInputHandler);
  if (state.inputHandler) el.removeEventListener('input', state.inputHandler);
  if (state.keydownHandler) el.removeEventListener('keydown', state.keydownHandler);
  if (state.pasteHandler) el.removeEventListener('paste', state.pasteHandler);
}

function applyUpdate(
  el: HTMLInputElement,
  state: PhoneMaskActionState,
  newParams: string | PhoneMaskActionOptions | undefined
): void {
  const newOptions = parseParams(newParams);
  const oldCountry = state.options.country;
  state.options = newOptions;

  if (newOptions.country && newOptions.country !== oldCountry) {
    applyCountryChange(el, state, newOptions.country);
  }

  // Re-check el.value for externally applied value changes (mirrors Vue's updated hook)
  const maxDigits = state.formatter.getMaxDigits();
  const newDigits = extractDigits(el.value, maxDigits);
  const normalizedDisplay = state.formatter.formatDisplay(newDigits);
  if (newDigits !== state.digits || el.value !== normalizedDisplay) {
    state.digits = newDigits;
    updateDisplay(el, state);
  }
}

/**
 * Svelte action that applies phone number masking to an <input> element.
 *
 * Usage:
 *   <input use:phoneMask={'US'} />
 *   <input use:phoneMask={{ country: 'DE', onChange: (p) => console.log(p) }} />
 *   <input use:phoneMask={{ detect: true, onCountryChange: (c) => console.log(c) }} />
 */
export function phoneMask(
  el: HTMLInputElement,
  params?: string | PhoneMaskActionOptions
): { update: (newParams?: string | PhoneMaskActionOptions) => void; destroy: () => void } {
  if (el.tagName !== 'INPUT') {
    console.warn('[phoneMask] Action can only be used on input elements');
    return { update: () => {}, destroy: () => {} };
  }

  el.setAttribute('type', 'tel');
  el.setAttribute('inputmode', 'tel');

  let initialized = false;
  let destroyed = false;
  let pendingParams: string | PhoneMaskActionOptions | undefined | null = null;

  const init = async (initialParams: string | PhoneMaskActionOptions | undefined) => {
    const options = parseParams(initialParams);
    const locale = options.locale || getNavigatorLang();
    const country = await resolveCountry(options);

    if (destroyed) return;

    const state: PhoneMaskActionState = {
      country,
      formatter: createPhoneFormatter(country),
      digits: '',
      locale,
      options
    };

    (el as PhoneMaskActionElement).__phoneMaskState = state;
    attachHandlers(el, state);

    el.setAttribute('placeholder', state.formatter.getPlaceholder());

    if (state.options.onCountryChange) {
      state.options.onCountryChange(state.country);
    }

    if (el.value) {
      state.digits = extractDigits(el.value, state.formatter.getMaxDigits());
      updateDisplay(el, state);
    }

    initialized = true;

    if (pendingParams !== null) {
      const queued = pendingParams;
      pendingParams = null;
      applyUpdate(el, state, queued);
    }
  };

  init(params);

  return {
    update(newParams?: string | PhoneMaskActionOptions) {
      if (!initialized) {
        pendingParams = newParams ?? null;
        return;
      }
      const state = (el as PhoneMaskActionElement).__phoneMaskState;
      if (state) applyUpdate(el, state, newParams);
    },

    destroy() {
      destroyed = true;
      const state = (el as PhoneMaskActionElement).__phoneMaskState;
      if (state) {
        detachHandlers(el, state);
        delete (el as PhoneMaskActionElement).__phoneMaskState;
      }
    }
  };
}

/**
 * Programmatically switch the country on an element that has the phoneMask action mounted.
 * Returns true if applied successfully, false if the element has no active action state.
 */
export function phoneMaskSetCountry(el: HTMLInputElement, newCountryCode: string): boolean {
  const state = (el as PhoneMaskActionElement).__phoneMaskState;
  if (!state) return false;
  try {
    applyCountryChange(el, state, newCountryCode);
    return true;
  } catch {
    return false;
  }
}
