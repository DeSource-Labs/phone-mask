/// <reference types="vitest/globals" />
import { flushSync } from 'svelte';
import { phoneMask } from '@src/attachments/phoneMask.svelte';
import type { PhoneMaskAttachmentElement } from '@src/types';

vi.mock('@desource/phone-mask', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@desource/phone-mask')>();
  return {
    ...actual,
    detectByGeoIp: vi.fn().mockResolvedValue(null)
  };
});

import { detectByGeoIp } from '@desource/phone-mask';

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const settle = async () => {
  await flushPromises();
  flushSync();
};

function createInputEl(): PhoneMaskAttachmentElement {
  const el = document.createElement('input') as PhoneMaskAttachmentElement;
  document.body.appendChild(el);
  return el;
}

function removeEl(el: HTMLElement): void {
  if (el.parentNode) el.parentNode.removeChild(el);
}

describe('phoneMask attachment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    (detectByGeoIp as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  it('warns and skips initialization on non-input elements', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const div = document.createElement('div') as unknown as HTMLInputElement;

    const attachment = phoneMask({ country: 'US' });
    const cleanup = attachment(div);
    await settle();

    expect(warnSpy).toHaveBeenCalledWith('[phoneMask] Attachment can only be used on input elements');
    expect((div as unknown as PhoneMaskAttachmentElement).__phoneMaskState).toBeUndefined();

    if (cleanup) cleanup();
  });

  it('initializes from string country param', async () => {
    const el = createInputEl();
    const attachment = phoneMask('GB');
    const cleanup = attachment(el);
    await settle();

    const state = el.__phoneMaskState;
    expect(state).toBeDefined();
    expect(state?.country.id).toBe('GB');
    expect(el.getAttribute('type')).toBe('tel');
    expect(el.getAttribute('inputmode')).toBe('tel');
    expect(el.getAttribute('placeholder')).toBeTruthy();

    if (cleanup) cleanup();
    removeEl(el);
  });

  it('triggers initial country callback when provided', async () => {
    const onCountryChange = vi.fn();
    const el = createInputEl();
    const attachment = phoneMask({ country: 'US', onCountryChange });
    const cleanup = attachment(el);
    await settle();

    const state = el.__phoneMaskState!;
    expect(onCountryChange).toHaveBeenCalledWith(state.country);

    if (cleanup) cleanup();
    removeEl(el);
  });

  it('uses detect flow and falls back to locale country when geo lookup fails', async () => {
    vi.stubGlobal('navigator', { language: 'de-DE' });
    (detectByGeoIp as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('offline'));

    const el = createInputEl();
    const attachment = phoneMask({ detect: true });
    const cleanup = attachment(el);
    await settle();

    expect(el.__phoneMaskState?.country.id).toBe('DE');

    if (cleanup) cleanup();
    removeEl(el);
  });

  it('uses detected geo country when lookup succeeds', async () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    (detectByGeoIp as ReturnType<typeof vi.fn>).mockResolvedValue('DE');

    const el = createInputEl();
    const attachment = phoneMask({ detect: true });
    const cleanup = attachment(el);
    await settle();

    expect(el.__phoneMaskState?.country.id).toBe('DE');

    if (cleanup) cleanup();
    removeEl(el);
  });

  it('falls back to US when detect flow has no geo and no locale region', async () => {
    vi.stubGlobal('navigator', { language: 'en' });
    (detectByGeoIp as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('offline'));

    const el = createInputEl();
    const attachment = phoneMask({ detect: true });
    const cleanup = attachment(el);
    await settle();

    expect(el.__phoneMaskState?.country.id).toBe('US');

    if (cleanup) cleanup();
    removeEl(el);
  });

  it('defaults to US when no country and detect are provided', async () => {
    const el = createInputEl();
    const attachment = phoneMask();
    const cleanup = attachment(el);
    await settle();

    expect(el.__phoneMaskState?.country.id).toBe('US');

    if (cleanup) cleanup();
    removeEl(el);
  });

  it('parses initial external value and emits normalized phone payload', async () => {
    const onChange = vi.fn();
    const el = createInputEl();
    el.value = '2025550123456789'; // oversized — will be clamped to maxDigits

    const attachment = phoneMask({ country: 'US', onChange });
    const cleanup = attachment(el);
    await settle();

    const state = el.__phoneMaskState!;
    expect(state.digits.length).toBe(state.formatter.getMaxDigits());
    expect(el.value).toBe(state.formatter.formatDisplay(state.digits));

    const payload = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(payload).toBeDefined();
    expect(payload.digits).toBe(state.digits);
    expect(payload.full).toBe(`${state.country.code}${state.digits}`);
    expect(payload.fullFormatted).toBe(`${state.country.code} ${el.value}`);

    if (cleanup) cleanup();
    removeEl(el);
  });

  it('handles input, keydown and paste events through attachment listeners', async () => {
    const onChange = vi.fn();
    const el = createInputEl();
    const attachment = phoneMask({ country: 'US', onChange });
    const cleanup = attachment(el);
    await settle();

    // input event
    el.value = '20255501';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(el.__phoneMaskState?.digits).toBe('20255501');

    // keydown ArrowLeft — should not change digits
    const beforeNavDigits = el.__phoneMaskState?.digits;
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    await settle();
    expect(el.__phoneMaskState?.digits).toBe(beforeNavDigits);

    // keydown Backspace at end — should remove one digit
    el.setSelectionRange(el.value.length, el.value.length);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    await settle();
    expect(el.__phoneMaskState?.digits.length).toBeLessThan((beforeNavDigits ?? '').length);

    // paste with no digits — should not change digits
    const beforePasteDigits = el.__phoneMaskState?.digits;
    const noDigitsPaste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(noDigitsPaste, 'clipboardData', {
      value: { getData: () => 'abc()' },
      configurable: true
    });
    el.dispatchEvent(noDigitsPaste);
    await settle();
    expect(el.__phoneMaskState?.digits).toBe(beforePasteDigits);

    // paste with digits — should change digits
    el.setSelectionRange(1, 1);
    const digitsPaste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(digitsPaste, 'clipboardData', {
      value: { getData: () => '99' },
      configurable: true
    });
    el.dispatchEvent(digitsPaste);
    await settle();
    expect(el.__phoneMaskState?.digits).not.toBe(beforePasteDigits);
    expect(onChange).toHaveBeenCalled();

    if (cleanup) cleanup();
    removeEl(el);
  });

  it('removes listeners and state on cleanup', async () => {
    const el = createInputEl();
    const attachment = phoneMask({ country: 'US' });
    const cleanup = attachment(el);
    await settle();

    const removeListenerSpy = vi.spyOn(el, 'removeEventListener');
    if (cleanup) cleanup();

    expect(removeListenerSpy).toHaveBeenCalledWith('beforeinput', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('paste', expect.any(Function));
    expect(el.__phoneMaskState).toBeUndefined();

    removeEl(el);
  });
});
