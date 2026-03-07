import type { Attachment } from 'svelte/attachments';
import { extractDigits, createPhoneFormatter } from '@desource/phone-mask';
import { usePhoneMask } from '../composables/usePhoneMask.svelte';
import type { PhoneMaskAttachmentOptions, PhoneMaskAttachmentState, PhoneMaskAttachmentElement } from '../types';

function parseParams(params: string | PhoneMaskAttachmentOptions | undefined): PhoneMaskAttachmentOptions {
  if (typeof params === 'string') return { country: params };
  if (params && typeof params === 'object') return params;
  return {};
}

/**
 * Svelte 5.29+ attachment that applies phone number masking to an <input> element.
 *
 * Usage:
 *   <input {@attach phoneMask('US')} />
 *   <input {@attach phoneMask({ country: 'DE', onChange: (p) => console.log(p) })} />
 *   <input {@attach phoneMask({ detect: true, onCountryChange: (c) => console.log(c) })} />
 *
 * Unlike the `use:` action, the factory re-runs reactively when reactive state
 * in the call site changes — no `update()` hook needed.
 */
export function phoneMask(params?: string | PhoneMaskAttachmentOptions): Attachment<HTMLInputElement> {
  return (el) => {
    if (el.tagName !== 'INPUT') {
      console.warn('[phoneMask] Attachment can only be used on input elements');
      return;
    }

    const options = parseParams(params);

    // $effect.root creates a detached reactive scope that works outside a component,
    // and destroys all contained effects synchronously when its return value is called.
    const stopRoot = $effect.root(() => {
      // Seed initial digits from any pre-existing input value (clamped later by useFormatter)
      let digits = $state(el.value ? extractDigits(el.value, 15) : '');

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

      (el as PhoneMaskAttachmentElement).__phoneMaskState = {
        get country() {
          return mask.country;
        },
        get formatter() {
          return createPhoneFormatter(mask.country);
        },
        get digits() {
          return mask.digits;
        },
        get locale() {
          return mask.locale;
        },
        options,
        setCountry: (code: string) => mask.setCountry(code)
      } as PhoneMaskAttachmentState;
    });

    return () => {
      // Destroying the root synchronously runs all $effect cleanups (removes event listeners)
      stopRoot();
      delete (el as PhoneMaskAttachmentElement).__phoneMaskState;
    };
  };
}

/**
 * Programmatically switch the country on an element that has the phoneMask attachment mounted.
 * Returns true if applied successfully, false if the element has no active attachment state.
 */
export function phoneMaskSetCountry(el: HTMLInputElement, newCountryCode: string): boolean {
  const state = (el as PhoneMaskAttachmentElement).__phoneMaskState;
  if (!state) return false;
  try {
    return state.setCountry(newCountryCode);
  } catch {
    return false;
  }
}
