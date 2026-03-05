/// <reference types="vitest/globals" />
import { vPhoneMask } from '../../src/directives/vPhoneMask';
import type { DirectiveHTMLInputElement } from '../../src/types';

describe('vPhoneMask directive', () => {
  it('clamps external value updates to formatter max digits in updated()', async () => {
    const onChange = vi.fn();
    const el = document.createElement('input') as DirectiveHTMLInputElement;
    document.body.appendChild(el);

    const binding = {
      value: {
        country: 'US',
        onChange
      }
    } as any;

    await vPhoneMask.mounted?.(el, binding);

    const state = el.__phoneMaskState;
    expect(state).toBeDefined();

    const maxDigits = state!.formatter.getMaxDigits();
    expect(maxDigits).toBeGreaterThan(0);

    // Simulate external model/DOM write with an overlong raw value.
    el.value = '12345678901234567890';
    await vPhoneMask.updated?.(el, binding);

    const updatedState = el.__phoneMaskState!;
    expect(updatedState.digits.length).toBe(maxDigits);

    const lastCall = onChange.mock.calls.at(-1)?.[0];
    expect(lastCall).toBeDefined();
    expect(lastCall.digits).toBe(updatedState.digits);
    expect(lastCall.digits.length).toBe(maxDigits);

    vPhoneMask.unmounted?.(el);
    document.body.removeChild(el);
  });
});
