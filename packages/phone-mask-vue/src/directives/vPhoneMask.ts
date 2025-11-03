import { type Directive, type DirectiveBinding, nextTick } from 'vue';
import { MasksFullMap, MasksFullMapEn, type CountryKey, type MaskFull } from '@desource/phone-mask';

import { createPhoneFormatter, setCaret, extractDigits, getSelection } from '../composables/usePhoneFormatter';
import { Delimiters, GEO_IP_TIMEOUT, GEO_IP_URL, InvalidPattern, NavigationKeys } from '../consts';
import type { PMaskDirectiveOptions, PMaskDirectiveState, DirectiveHTMLInputElement } from '../types';

/** Get browser navigator language */
function getNavigatorLang(): string {
  if (typeof navigator !== 'undefined') {
    return navigator.language || '';
  }
  return '';
}

/** Get country data by ISO code and locale */
function getCountry(countryCode: string, locale: string): MaskFull | null {
  const isEn = locale.toLowerCase().startsWith('en');
  const countriesMap = isEn ? MasksFullMapEn : MasksFullMap(locale);
  const id = countryCode.toUpperCase() as CountryKey;
  const found = countriesMap[id];
  return found ? { id, ...found } : null;
}

/** Get default country (US) for the given locale */
function getDefaultCountry(locale: string): MaskFull {
  const isEn = locale.toLowerCase().startsWith('en');
  const countries = isEn ? MasksFullMapEn : MasksFullMap(locale);
  return { id: 'US', ...countries.US };
}

/**
 * Detect country from GeoIP service.
 * Attempts to fetch country code from external API with timeout
 */
async function detectCountryFromGeoIP(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEO_IP_TIMEOUT);

    const res = await fetch(GEO_IP_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const json = await res.json();
    const code = (json.country || json.country_code || json.countryCode || json.country_code2 || '')
      .toString()
      .toUpperCase();

    return code || null;
  } catch {
    return null;
  }
}

/**
 * Detect country from browser locale.
 * Parses navigator.language to extract region code
 */
function detectCountryFromLocale(): string | null {
  try {
    const lang = getNavigatorLang();

    try {
      const loc = new Intl.Locale(lang);
      if (loc.region) return loc.region.toUpperCase();
    } catch {
      // Ignore
    }

    const parts = lang.split(/[-_]/);
    if (parts.length > 1) return parts[1]?.toUpperCase() || null;
  } catch {
    // Ignore
  }

  return null;
}

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

  const locale = options.locale || getNavigatorLang() || 'en';
  let country: MaskFull | null = null;

  // Determine country
  if (options.country) {
    country = getCountry(options.country, locale);
  } else if (options.detect) {
    const geoCountry = await detectCountryFromGeoIP();
    if (geoCountry) {
      country = getCountry(geoCountry, locale);
    }

    if (!country) {
      const localeCountry = detectCountryFromLocale();
      if (localeCountry) {
        country = getCountry(localeCountry, locale);
      }
    }
  }

  if (!country) {
    country = getDefaultCountry(locale);
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
 * Create beforeinput event handler.
 * Blocks invalid characters -> dirty hack for autocorrect issues
 */
function createBeforeInputHandler(el: HTMLInputElement): (e: InputEvent) => void {
  return (e: InputEvent) => {
    const data = e.data;
    if (e.inputType !== 'insertText' || !data) return;

    // Block invalid characters & multiple spaces
    if (InvalidPattern.test(data) || (data === ' ' && el.value.endsWith(' '))) {
      e.preventDefault();
    }
  };
}

/**
 * Create input event handler.
 * Extracts digits from typed input, formats display, and positions cursor
 */
function createInputHandler(el: HTMLInputElement, state: PMaskDirectiveState): (e: Event) => void {
  return (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target) return;

    const raw = target.value || '';
    const maxDigits = state.formatter.getMaxDigits();
    state.digits = extractDigits(raw, maxDigits);

    updateDisplay(el, state);

    nextTick(() => {
      const pos = state.formatter.getCaretPosition(state.digits.length);
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
    // Allow meta & navigation keys
    if (e.ctrlKey || e.metaKey || e.altKey || NavigationKeys.includes(e.key)) return;

    const [selStart, selEnd] = getSelection(el);

    if (e.key === 'Backspace') {
      e.preventDefault();

      if (selStart !== selEnd) {
        // Handle selection deletion
        const range = state.formatter.getDigitRange(state.digits, selStart, selEnd);
        if (range) {
          const [start, end] = range;
          state.digits = state.digits.slice(0, start) + state.digits.slice(end);
          updateDisplay(el, state);
          nextTick(() => {
            const pos = state.formatter.getCaretPosition(start);
            setCaret(el, pos);
          });
        }
        return;
      }

      // Delete single character before caret, skipping delimiters
      if (selStart > 0) {
        const displayStr = el.value;
        // Find previous digit position by skipping delimiters
        let prevPos = selStart - 1;
        while (prevPos >= 0 && Delimiters.includes(displayStr[prevPos]!)) {
          prevPos--;
        }

        if (prevPos >= 0) {
          const range = state.formatter.getDigitRange(state.digits, prevPos, prevPos + 1);
          if (range) {
            const [start] = range;
            state.digits = state.digits.slice(0, start) + state.digits.slice(start + 1);
            updateDisplay(el, state);
            nextTick(() => {
              const pos = state.formatter.getCaretPosition(start);
              setCaret(el, pos);
            });
          }
        }
      }
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();

      if (selStart !== selEnd) {
        const range = state.formatter.getDigitRange(state.digits, selStart, selEnd);
        if (range) {
          const [start, end] = range;
          state.digits = state.digits.slice(0, start) + state.digits.slice(end);
          updateDisplay(el, state);
          nextTick(() => {
            const pos = state.formatter.getCaretPosition(start);
            setCaret(el, pos);
          });
        }
        return;
      }

      // Delete character at caret
      if (selStart < el.value.length) {
        const range = state.formatter.getDigitRange(state.digits, selStart, selStart + 1);
        if (range) {
          const [start] = range;
          state.digits = state.digits.slice(0, start) + state.digits.slice(start + 1);
          updateDisplay(el, state);
          nextTick(() => {
            const pos = state.formatter.getCaretPosition(start);
            setCaret(el, pos);
          });
        }
      }
      return;
    }

    // Block max digits
    if (/^[0-9]$/.test(e.key)) {
      if (state.digits.length >= state.formatter.getMaxDigits()) {
        e.preventDefault();
      }
      return;
    }

    // Block non-numeric
    if (e.key.length === 1) {
      e.preventDefault();
    }
  };
}

/**
 * Create paste event handler.
 * Extracts digits from pasted content and intelligently inserts them
 */
function createPasteHandler(el: HTMLInputElement, state: PMaskDirectiveState): (e: ClipboardEvent) => void {
  return (e: ClipboardEvent) => {
    e.preventDefault();

    const text = e.clipboardData?.getData('text') || '';
    const maxDigits = state.formatter.getMaxDigits();
    const pastedDigits = extractDigits(text, maxDigits);

    if (pastedDigits.length === 0) return;

    const [selStart, selEnd] = getSelection(el);

    if (selStart !== selEnd) {
      // Replace selection with pasted content
      const range = state.formatter.getDigitRange(state.digits, selStart, selEnd);

      if (range) {
        const [start, end] = range;
        const left = state.digits.slice(0, start);
        const right = state.digits.slice(end);
        state.digits = extractDigits(left + pastedDigits + right, maxDigits);
        updateDisplay(el, state);
        nextTick(() => {
          const pos = state.formatter.getCaretPosition(start + pastedDigits.length);
          setCaret(el, pos);
        });
        return;
      }
    }

    // Insert at current position
    const range = state.formatter.getDigitRange(state.digits, selStart, selStart);
    const insertIndex = range ? range[0] : state.digits.length;

    const left = state.digits.slice(0, insertIndex);
    const right = state.digits.slice(insertIndex);
    state.digits = extractDigits(left + pastedDigits + right, maxDigits);
    updateDisplay(el, state);

    nextTick(() => {
      const pos = state.formatter.getCaretPosition(insertIndex + pastedDigits.length);
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
  if (!newCountry) return;

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
    state.beforeInputHandler = createBeforeInputHandler(el);

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
