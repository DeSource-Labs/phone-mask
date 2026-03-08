/// <reference types="vitest/globals" />
import { phoneMaskAction, phoneMaskActionSetCountry } from '@src/actions/phoneMask';
import type { PhoneMaskActionElement } from '@src/types';

vi.mock('@desource/phone-mask', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@desource/phone-mask')>();
  return {
    ...actual,
    detectByGeoIp: vi.fn().mockResolvedValue(null)
  };
});

import { detectByGeoIp } from '@desource/phone-mask';

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function createInputEl(): PhoneMaskActionElement {
  const el = document.createElement('input') as PhoneMaskActionElement;
  document.body.appendChild(el);
  return el;
}

function removeEl(el: HTMLElement): void {
  if (el.parentNode) el.parentNode.removeChild(el);
}

describe('phoneMaskAction', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    (detectByGeoIp as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  it('warns and skips initialization on non-input elements', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const div = document.createElement('div') as unknown as HTMLInputElement;

    const action = phoneMaskAction(div, { country: 'US' });

    expect(warnSpy).toHaveBeenCalledWith('[phoneMaskAction] Action can only be used on input elements');
    expect((div as unknown as PhoneMaskActionElement).__phoneMaskActionState).toBeUndefined();

    action.destroy();
  });

  it('initializes from string country param', () => {
    const el = createInputEl();
    const action = phoneMaskAction(el, 'GB');

    const state = el.__phoneMaskActionState;
    expect(state).toBeDefined();
    expect(state?.country.id).toBe('GB');
    expect(el.getAttribute('type')).toBe('tel');
    expect(el.getAttribute('inputmode')).toBe('tel');
    expect(el.getAttribute('placeholder')).toBeTruthy();

    action.destroy();
    removeEl(el);
  });

  it('triggers initial country callback when provided', () => {
    const onCountryChange = vi.fn();
    const el = createInputEl();
    const action = phoneMaskAction(el, { country: 'US', onCountryChange });

    const state = el.__phoneMaskActionState!;
    expect(onCountryChange).toHaveBeenCalledWith(state.country);

    action.destroy();
    removeEl(el);
  });

  it('uses detect flow and falls back to locale country when geo returns null', async () => {
    vi.stubGlobal('navigator', { language: 'de-DE' });
    (detectByGeoIp as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const el = createInputEl();
    const action = phoneMaskAction(el, { detect: true });
    await flushPromises();

    expect(el.__phoneMaskActionState?.country.id).toBe('DE');

    action.destroy();
    removeEl(el);
  });

  it('uses detected geo country when lookup succeeds', async () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    (detectByGeoIp as ReturnType<typeof vi.fn>).mockResolvedValue('DE');

    const el = createInputEl();
    const action = phoneMaskAction(el, { detect: true });
    await flushPromises();

    expect(el.__phoneMaskActionState?.country.id).toBe('DE');

    action.destroy();
    removeEl(el);
  });

  it('falls back to US when detect flow has no geo and no locale region', async () => {
    vi.stubGlobal('navigator', { language: 'en' });
    (detectByGeoIp as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const el = createInputEl();
    const action = phoneMaskAction(el, { detect: true });
    await flushPromises();

    expect(el.__phoneMaskActionState?.country.id).toBe('US');

    action.destroy();
    removeEl(el);
  });

  it('defaults to US when no country and detect are provided', () => {
    const el = createInputEl();
    const action = phoneMaskAction(el);

    expect(el.__phoneMaskActionState?.country.id).toBe('US');

    action.destroy();
    removeEl(el);
  });

  it('parses initial external value and emits normalized phone payload', () => {
    const onChange = vi.fn();
    const el = createInputEl();
    el.value = '2025550123456789'; // oversized — will be clamped to maxDigits

    const action = phoneMaskAction(el, { country: 'US', onChange });

    const state = el.__phoneMaskActionState!;
    expect(state.digits.length).toBe(state.formatter.getMaxDigits());
    expect(el.value).toBe(state.formatter.formatDisplay(state.digits));

    const payload = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(payload).toBeDefined();
    expect(payload.digits).toBe(state.digits);
    expect(payload.full).toBe(`${state.country.code}${state.digits}`);
    expect(payload.fullFormatted).toBe(`${state.country.code} ${el.value}`);

    action.destroy();
    removeEl(el);
  });

  it('handles input, keydown and paste events through action listeners', async () => {
    const onChange = vi.fn();
    const el = createInputEl();
    const action = phoneMaskAction(el, { country: 'US', onChange });

    // input event
    el.value = '20255501';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();
    expect(el.__phoneMaskActionState?.digits).toBe('20255501');

    // keydown ArrowLeft — should not change digits
    const beforeNavDigits = el.__phoneMaskActionState?.digits;
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    await flushPromises();
    expect(el.__phoneMaskActionState?.digits).toBe(beforeNavDigits);

    // keydown Backspace at end — should remove one digit
    el.setSelectionRange(el.value.length, el.value.length);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    await flushPromises();
    expect(el.__phoneMaskActionState?.digits.length).toBeLessThan((beforeNavDigits ?? '').length);

    // paste with no digits — should not change digits
    const beforePasteDigits = el.__phoneMaskActionState?.digits;
    const noDigitsPaste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(noDigitsPaste, 'clipboardData', {
      value: { getData: () => 'abc()' },
      configurable: true
    });
    el.dispatchEvent(noDigitsPaste);
    await flushPromises();
    expect(el.__phoneMaskActionState?.digits).toBe(beforePasteDigits);

    // paste with digits — should change digits
    el.setSelectionRange(1, 1);
    const digitsPaste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(digitsPaste, 'clipboardData', {
      value: { getData: () => '99' },
      configurable: true
    });
    el.dispatchEvent(digitsPaste);
    await flushPromises();
    expect(el.__phoneMaskActionState?.digits).not.toBe(beforePasteDigits);
    expect(onChange).toHaveBeenCalled();

    action.destroy();
    removeEl(el);
  });

  it('removes listeners and state on destroy', () => {
    const el = createInputEl();
    const action = phoneMaskAction(el, { country: 'US' });

    const removeListenerSpy = vi.spyOn(el, 'removeEventListener');
    action.destroy();

    expect(removeListenerSpy).toHaveBeenCalledWith('beforeinput', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('paste', expect.any(Function));
    expect(el.__phoneMaskActionState).toBeUndefined();

    removeEl(el);
  });

  it('updates country when update() is called with a new country', () => {
    const el = createInputEl();
    const action = phoneMaskAction(el, { country: 'US' });

    expect(el.__phoneMaskActionState?.country.id).toBe('US');

    action.update({ country: 'GB' });

    expect(el.__phoneMaskActionState?.country.id).toBe('GB');
    expect(el.getAttribute('placeholder')).toBeTruthy();

    action.destroy();
    removeEl(el);
  });

  it('normalizes externally changed value on update()', () => {
    const onChange = vi.fn();
    const el = createInputEl();
    const action = phoneMaskAction(el, { country: 'US', onChange });

    el.value = '999';
    action.update({ country: 'US', onChange });

    const state = el.__phoneMaskActionState!;
    expect(el.value).toBe(state.formatter.formatDisplay(state.digits));

    action.destroy();
    removeEl(el);
  });
});

describe('phoneMaskActionSetCountry', () => {
  it('returns false when element has no action state', () => {
    const el = document.createElement('input') as PhoneMaskActionElement;
    expect(phoneMaskActionSetCountry(el, 'DE')).toBe(false);
  });

  it('returns true and updates country when state exists', () => {
    const el = createInputEl();
    const action = phoneMaskAction(el, { country: 'US' });

    expect(phoneMaskActionSetCountry(el, 'DE')).toBe(true);
    expect(el.__phoneMaskActionState?.country.id).toBe('DE');

    action.destroy();
    removeEl(el);
  });
});
