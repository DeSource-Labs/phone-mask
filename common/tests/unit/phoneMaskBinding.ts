/// <reference types="vitest/globals" />
import type { TestTools } from './setup/tools';

export interface PhoneMaskBindingElement extends HTMLInputElement {
  [stateKey: string]: any;
}

export interface PhoneMaskBindingSetupResult {
  el: PhoneMaskBindingElement;
  onChange: ReturnType<typeof vi.fn>;
  onCountryChange: ReturnType<typeof vi.fn>;
  update: (newOptions?: any) => Promise<void> | void;
  unmount: () => void;
}

export type BindingSetupFn = (
  elTag?: 'input' | 'div',
  elValue?: string
) => (options?: any) => Promise<PhoneMaskBindingSetupResult>;

export interface PhoneMaskBindingConfig {
  /** Property key on the element that holds the binding state, e.g. `__phoneMaskState` */
  stateKey: string;
  /** Expected console.warn message when applied to a non-input element */
  warnMessage: string;
  /** Mock for detectByGeoIp — reset before each test */
  detectByGeoIpMock: ReturnType<typeof vi.fn>;
}

export function testPhoneMaskBinding(setup: BindingSetupFn, config: PhoneMaskBindingConfig, { act }: TestTools): void {
  const { stateKey, warnMessage, detectByGeoIpMock } = config;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    detectByGeoIpMock.mockResolvedValue(null);
  });

  it('warns and skips initialization on non-input elements', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { el, unmount } = await setup('div')({ country: 'US' });

    expect(warnSpy).toHaveBeenCalledWith(warnMessage);
    expect(el[stateKey]).toBeUndefined();

    unmount();
  });

  it('initializes from string country param', async () => {
    const { el, unmount } = await setup('input')('GB');

    const state = el[stateKey];
    expect(state).toBeDefined();
    expect(state?.country.id).toBe('GB');
    expect(el.getAttribute('type')).toBe('tel');
    expect(el.getAttribute('inputmode')).toBe('tel');
    expect(el.getAttribute('placeholder')).toBeTruthy();

    unmount();
  });

  it('triggers initial country callback when provided', async () => {
    const { el, onCountryChange, unmount } = await setup('input')({ country: 'US' });

    const state = el[stateKey]!;
    expect(onCountryChange).toHaveBeenCalledWith(state.country);

    unmount();
  });

  it('uses detect flow and falls back to locale country when geo lookup fails', async () => {
    vi.stubGlobal('navigator', { language: 'de-DE' });
    detectByGeoIpMock.mockResolvedValue(null);

    const { el, unmount } = await setup('input')({ detect: true });

    expect(el[stateKey]?.country.id).toBe('DE');

    unmount();
  });

  it('uses detected geo country when lookup succeeds', async () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    detectByGeoIpMock.mockResolvedValue('DE');

    const { el, unmount } = await setup('input')({ detect: true });

    expect(el[stateKey]?.country.id).toBe('DE');

    unmount();
  });

  it('falls back to US when detect flow has no geo and no locale region', async () => {
    vi.stubGlobal('navigator', { language: 'en' });
    detectByGeoIpMock.mockResolvedValue(null);

    const { el, unmount } = await setup('input')({ detect: true });

    expect(el[stateKey]?.country.id).toBe('US');

    unmount();
  });

  it('defaults to US when no country and detect are provided', async () => {
    const { el, unmount } = await setup('input')();

    expect(el[stateKey]?.country.id).toBe('US');

    unmount();
  });

  it('parses initial external value and emits normalized phone payload', async () => {
    // oversized — will be clamped to maxDigits
    const { el, unmount, onChange } = await setup('input', '2025550123456789')({ country: 'US' });

    const state = el[stateKey]!;
    expect(state.digits.length).toBe(state.formatter.getMaxDigits());
    expect(el.value).toBe(state.formatter.formatDisplay(state.digits));

    const payload = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(payload).toBeDefined();
    expect(payload.digits).toBe(state.digits);
    expect(payload.full).toBe(`${state.country.code}${state.digits}`);
    expect(payload.fullFormatted).toBe(`${state.country.code} ${el.value}`);

    unmount();
  });

  it('handles input, keydown and paste events through binding listeners', async () => {
    const { el, unmount, onChange } = await setup('input')({ country: 'US' });

    // input event
    await act(() => {
      el.value = '20255501';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(el[stateKey]?.digits).toBe('20255501');

    // keydown ArrowLeft — should not change digits
    const beforeNavDigits = el[stateKey]?.digits;
    await act(() => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    });
    expect(el[stateKey]?.digits).toBe(beforeNavDigits);

    // keydown Backspace at end — should remove one digit
    await act(() => {
      el.setSelectionRange(el.value.length, el.value.length);
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    });
    expect(el[stateKey]?.digits.length).toBeLessThan((beforeNavDigits ?? '').length);

    // paste with no digits — should not change digits
    const beforePasteDigits = el[stateKey]?.digits;
    await act(() => {
      const noDigitsPaste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
      Object.defineProperty(noDigitsPaste, 'clipboardData', {
        value: { getData: () => 'abc()' },
        configurable: true
      });
      el.dispatchEvent(noDigitsPaste);
    });
    expect(el[stateKey]?.digits).toBe(beforePasteDigits);

    // paste with digits — should change digits
    await act(() => {
      el.setSelectionRange(1, 1);
      const digitsPaste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
      Object.defineProperty(digitsPaste, 'clipboardData', {
        value: { getData: () => '99' },
        configurable: true
      });
      el.dispatchEvent(digitsPaste);
    });
    expect(el[stateKey]?.digits).not.toBe(beforePasteDigits);
    expect(onChange).toHaveBeenCalled();

    unmount();
  });

  it('removes listeners and state on cleanup', async () => {
    const { el, unmount } = await setup('input')({ country: 'US' });

    const removeListenerSpy = vi.spyOn(el, 'removeEventListener');
    unmount();

    expect(removeListenerSpy).toHaveBeenCalledWith('beforeinput', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('paste', expect.any(Function));
    expect(el[stateKey]).toBeUndefined();
  });

  it('updates country when update() is called with a new country', async () => {
    const { el, unmount, update } = await setup('input')({ country: 'US' });

    expect(el[stateKey]?.country.id).toBe('US');

    await update({ country: 'GB' });

    expect(el[stateKey]?.country.id).toBe('GB');
    expect(el.getAttribute('placeholder')).toBeTruthy();

    unmount();
  });

  it('normalizes externally changed value on update()', async () => {
    const { el, unmount, update } = await setup('input')({ country: 'US' });

    el.value = '999';

    await update({ country: 'US' });

    const state = el[stateKey]!;
    expect(el.value).toBe(state.formatter.formatDisplay(state.digits));

    unmount();
  });
}
