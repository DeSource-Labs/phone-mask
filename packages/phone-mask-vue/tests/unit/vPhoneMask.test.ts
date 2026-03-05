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

  it('normalizes an overlong external write even when clamped digits are unchanged', async () => {
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

    // First external update sets max-length digits.
    el.value = '1234567890';
    await vPhoneMask.updated?.(el, binding);

    const stateAfterFirstUpdate = el.__phoneMaskState!;
    const expectedDisplay = stateAfterFirstUpdate.formatter.formatDisplay(stateAfterFirstUpdate.digits);
    expect(stateAfterFirstUpdate.digits).toBe('1234567890');
    expect(el.value).toBe(expectedDisplay);

    // Second external update writes a longer value with the same max-length prefix.
    el.value = '1234567890123';
    await vPhoneMask.updated?.(el, binding);

    const stateAfterSecondUpdate = el.__phoneMaskState!;
    expect(stateAfterSecondUpdate.digits).toBe('1234567890');
    expect(el.value).toBe(expectedDisplay);

    vPhoneMask.unmounted?.(el);
    document.body.removeChild(el);
  });
});
