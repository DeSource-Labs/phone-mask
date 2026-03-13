/// <reference types="vitest/globals" />
import type { TestTools } from './setup/tools';

interface PhoneMaskBindingOptions {
  country?: string;
  locale?: string;
  detect?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (phone: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCountryChange?: (country: any) => void;
}

interface PhoneMaskBindingState {
  country: {
    id: string;
    code: string;
  };
  formatter: {
    getMaxDigits: () => number;
    formatDisplay: (value: string) => string;
  };
  digits: string;
  locale: string;
  options: PhoneMaskBindingOptions;
  setCountry?: (code: string) => boolean;
}

export interface PhoneMaskBindingElement extends HTMLInputElement {
  __phoneMaskState?: PhoneMaskBindingState;
}

export interface PhoneMaskBindingSetupResult {
  el: PhoneMaskBindingElement;
  onChange: ReturnType<typeof vi.fn>;
  onCountryChange: ReturnType<typeof vi.fn>;
  update: (newOptions?: PhoneMaskBindingOptions) => Promise<void> | void;
  unmount: () => void;
}

type SetupOptions = string | PhoneMaskBindingOptions | undefined;

type SetupFn = (
  elTag?: 'input' | 'div',
  elValue?: string
) => (options?: SetupOptions) => Promise<PhoneMaskBindingSetupResult>;

interface SetupConfig {
  /** Expected console.warn message when applied to a non-input element */
  warnMessage: string;
  /** Mock for detectByGeoIp — reset before each test */
  detectByGeoIpMock: ReturnType<typeof vi.fn>;
}

export function testPhoneMaskBinding(setup: SetupFn, config: SetupConfig, { act }: TestTools): void {
  const { warnMessage, detectByGeoIpMock } = config;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    detectByGeoIpMock.mockResolvedValue(null);
  });

  it('warns and skips initialization on non-input elements', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { el, unmount } = await setup('div')({ country: 'US' });

    expect(warnSpy).toHaveBeenCalledWith(warnMessage);
    expect(el.__phoneMaskState).toBeUndefined();

    unmount();
  });

  it('initializes from string country param', async () => {
    const { el, unmount } = await setup('input')('GB');

    const state = el.__phoneMaskState;
    expect(state).toBeDefined();
    expect(state?.country.id).toBe('GB');
    expect(el.getAttribute('type')).toBe('tel');
    expect(el.getAttribute('inputmode')).toBe('tel');
    expect(el.getAttribute('placeholder')).toBeTruthy();

    unmount();
  });

  it('triggers initial country callback when provided', async () => {
    const { el, onCountryChange, unmount } = await setup('input')({ country: 'US' });

    const state = el.__phoneMaskState!;
    expect(onCountryChange).toHaveBeenCalledWith(state.country);

    unmount();
  });

  it('uses detected geo country when lookup succeeds', async () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    detectByGeoIpMock.mockResolvedValue('DE');

    const { el, unmount } = await setup('input')({ detect: true });

    expect(el.__phoneMaskState?.country.id).toBe('DE');

    unmount();
  });

  it('falls back to US when detect flow has no geo and no locale region', async () => {
    vi.stubGlobal('navigator', { language: 'en' });
    detectByGeoIpMock.mockResolvedValue(null);

    const { el, unmount } = await setup('input')({ detect: true });

    expect(el.__phoneMaskState?.country.id).toBe('US');

    unmount();
  });

  it('falls back to locale region when geo lookup is empty', async () => {
    vi.stubGlobal('navigator', { language: 'de-DE' });
    detectByGeoIpMock.mockResolvedValue(null);

    const { el, unmount } = await setup('input')({ detect: true });

    expect(el.__phoneMaskState?.country.id).toBe('DE');

    unmount();
  });

  it('does not use detect flow when country is provided', async () => {
    vi.stubGlobal('navigator', { language: 'en' });
    detectByGeoIpMock.mockResolvedValue('US');

    const { el, unmount } = await setup('input')({ country: 'DE', detect: true });

    expect(el.__phoneMaskState?.country.id).toBe('DE');

    unmount();
  });

  it('defaults to US when neither country nor detect is provided', async () => {
    const { el, unmount } = await setup('input')();

    expect(el.__phoneMaskState?.country.id).toBe('US');

    unmount();
  });

  it('parses initial external value and emits normalized phone payload', async () => {
    // oversized — will be clamped to maxDigits
    const { el, unmount, onChange } = await setup('input', '2025550123456789')({ country: 'US' });

    const state = el.__phoneMaskState!;
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
    expect(el.__phoneMaskState?.digits).toBe('20255501');

    // keydown ArrowLeft — should not change digits
    const beforeNavDigits = el.__phoneMaskState?.digits;
    await act(() => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    });
    expect(el.__phoneMaskState?.digits).toBe(beforeNavDigits);

    // keydown Backspace at end — should remove one digit
    await act(() => {
      el.setSelectionRange(el.value.length, el.value.length);
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    });
    expect(el.__phoneMaskState?.digits.length).toBeLessThan((beforeNavDigits ?? '').length);

    // paste with no digits — should not change digits
    const beforePasteDigits = el.__phoneMaskState?.digits;
    await act(() => {
      const noDigitsPaste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
      Object.defineProperty(noDigitsPaste, 'clipboardData', {
        value: { getData: () => 'abc()' },
        configurable: true
      });
      el.dispatchEvent(noDigitsPaste);
    });
    expect(el.__phoneMaskState?.digits).toBe(beforePasteDigits);

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
    expect(el.__phoneMaskState?.digits).not.toBe(beforePasteDigits);
    expect(onChange).toHaveBeenCalled();

    unmount();
  });

  it('updates state without callbacks when params are provided as a plain string', async () => {
    const { el, unmount } = await setup('input')('US');

    await act(() => {
      el.value = '2025550199';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(el.__phoneMaskState?.digits).toBe('2025550199');
    unmount();
  });

  it('ignores async detect completion after cleanup', async () => {
    let resolveGeo!: (value: string | null) => void;
    detectByGeoIpMock.mockImplementation(
      () =>
        new Promise<string | null>((resolve) => {
          resolveGeo = resolve;
        })
    );

    const { onCountryChange, unmount } = await setup('input')({ detect: true });
    unmount();
    const callsBeforeResolve = onCountryChange.mock.calls.length;

    resolveGeo('DE');
    await Promise.resolve();
    await Promise.resolve();

    expect(onCountryChange).toHaveBeenCalledTimes(callsBeforeResolve);
  });

  it('removes listeners and state on cleanup', async () => {
    const { el, unmount } = await setup('input')({ country: 'US' });

    const removeListenerSpy = vi.spyOn(el, 'removeEventListener');
    unmount();

    expect(removeListenerSpy).toHaveBeenCalledWith('beforeinput', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('paste', expect.any(Function));
    expect(el.__phoneMaskState).toBeUndefined();
  });

  it('updates country when update() is called with a new country', async () => {
    const { el, unmount, update } = await setup('input')({ country: 'US' });

    expect(el.__phoneMaskState?.country.id).toBe('US');

    await update({ country: 'GB' });

    expect(el.__phoneMaskState?.country.id).toBe('GB');
    expect(el.getAttribute('placeholder')).toBeTruthy();

    unmount();
  });

  it('does not update country when update() is called with an invalid country', async () => {
    const { el, unmount, update } = await setup('input')({ country: 'US' });

    expect(el.__phoneMaskState?.country.id).toBe('US');

    await update({ country: 'XX' });

    expect(el.__phoneMaskState?.country.id).toBe('US');

    unmount();
  });

  it('normalizes externally changed value on update()', async () => {
    const { el, unmount, update } = await setup('input')({ country: 'US' });

    el.value = '999';

    await update({ country: 'US' });

    const state = el.__phoneMaskState!;
    expect(el.value).toBe(state.formatter.formatDisplay(state.digits));

    unmount();
  });
}
