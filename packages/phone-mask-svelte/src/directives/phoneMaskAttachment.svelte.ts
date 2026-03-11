import { usePhoneMask } from '../composables/usePhoneMask.svelte';
import type { PhoneMaskBindingOptions, PhoneMaskBindingState, PhoneMaskBindingElement } from '../types';

// Local copy of Svelte's `Attachment` type to avoid a hard dependency on `svelte/attachments`for Svelte version below 5.29
export interface Attachment<T extends EventTarget = Element> {
  (element: T): void | (() => void);
}

function parseParams(params: string | PhoneMaskBindingOptions | undefined): PhoneMaskBindingOptions {
  if (typeof params === 'string') return { country: params };
  if (params && typeof params === 'object') return params;
  return {};
}

/**
 * Svelte 5.29+ attachment that applies phone number masking to an <input> element.
 *
 * Usage:
 *   <input {@attach phoneMaskAttachment('US')} />
 *   <input {@attach phoneMaskAttachment({ country: 'DE', onChange: (p) => console.log(p) })} />
 *   <input {@attach phoneMaskAttachment({ detect: true, onCountryChange: (c) => console.log(c) })} />
 *
 * Unlike the `use:` action, the factory re-runs reactively when reactive state
 * in the call site changes — no `update()` hook needed.
 */
export function phoneMaskAttachment(params?: string | PhoneMaskBindingOptions): Attachment<HTMLInputElement> {
  return (el) => {
    if (el.tagName !== 'INPUT') {
      console.warn('[phoneMaskAttachment] Attachment can only be used on input elements');
      return;
    }

    const options = parseParams(params);

    // $effect.root creates a detached reactive scope that works outside a component,
    // and destroys all contained effects synchronously when its return value is called.
    const stopRoot = $effect.root(() => {
      // Seed initial digits from any pre-existing input value
      let digits = $state(el.value || '');

      const mask = usePhoneMask({
        country: () => options.country,
        locale: () => options.locale,
        detect: () => options.detect,
        value: () => digits,
        onChange: (newDigits) => {
          digits = newDigits;
        },
        onPhoneChange: options.onChange,
        onCountryChange: options.onCountryChange
      });

      mask.inputRef = el;

      (el as PhoneMaskBindingElement).__phoneMaskState = {
        get country() {
          return mask.country;
        },
        get formatter() {
          return mask.formatter;
        },
        get digits() {
          return mask.digits;
        },
        get locale() {
          return mask.locale;
        },
        options,
        setCountry: (code: string) => mask.setCountry(code)
      } as PhoneMaskBindingState;
    });

    return () => {
      // Destroying the root synchronously runs all $effect cleanups (removes event listeners)
      stopRoot();
      delete (el as PhoneMaskBindingElement).__phoneMaskState;
    };
  };
}
