import type { PhoneMaskBindingElement } from '../types';

/**
 * Programmatically switch the country on an element with the phoneMaskAction mounted.
 * Returns true if applied successfully, false if the element has no active action state.
 */
export function phoneMaskSetCountry(el: HTMLInputElement, code: string): boolean {
  const state = (el as PhoneMaskBindingElement).__phoneMaskState;
  if (!state) return false;
  try {
    return state.setCountry(code);
  } catch {
    return false;
  }
}
