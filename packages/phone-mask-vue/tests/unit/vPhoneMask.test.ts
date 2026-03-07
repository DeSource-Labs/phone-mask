/* eslint-disable vue/one-component-per-file */
/// <reference types="vitest/globals" />
import { defineComponent, nextTick, ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { MasksFull, createPhoneFormatter } from '@desource/phone-mask';
import { vPhoneMask } from '../../src/directives/vPhoneMask';
import type { DirectiveHTMLInputElement, PMaskDirectiveOptions } from '../../src/types';

type BindingValue = string | PMaskDirectiveOptions | undefined;

function mountInputHost(options: { bindingValue?: BindingValue; externalValue?: string } = {}) {
  const { bindingValue: initialBindingValue = { country: 'US' }, externalValue: initialExternalValue = '' } = options;

  const bindingValue = ref<BindingValue>(initialBindingValue);
  const externalValue = ref(initialExternalValue);

  const Host = defineComponent({
    setup() {
      return {
        bindingValue,
        externalValue
      };
    },
    template: '<input data-test="phone" v-phone-mask="bindingValue" :value="externalValue" />'
  });

  const wrapper = mount(Host, {
    global: {
      directives: {
        phoneMask: vPhoneMask
      }
    }
  });

  const settle = async () => {
    await nextTick();
    await flushPromises();
    await nextTick();
  };

  const getInput = () => wrapper.get('[data-test="phone"]').element as DirectiveHTMLInputElement;

  return {
    wrapper,
    settle,
    getInput,
    setBindingValue: async (value: BindingValue) => {
      bindingValue.value = value;
      await settle();
    },
    setExternalValue: async (value: string) => {
      externalValue.value = value;
      await settle();
    }
  };
}

function mountNonInputHost(bindingValue: BindingValue = { country: 'US' }) {
  const value = ref<BindingValue>(bindingValue);

  const Host = defineComponent({
    setup() {
      return { value };
    },
    template: '<div data-test="target" v-phone-mask="value" />'
  });

  const wrapper = mount(Host, {
    global: {
      directives: {
        phoneMask: vPhoneMask
      }
    }
  });

  return {
    wrapper,
    settle: async () => {
      await nextTick();
      await flushPromises();
      await nextTick();
    }
  };
}

describe('vPhoneMask directive', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('warns and skips initialization on non-input elements', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { wrapper, settle } = mountNonInputHost();
    await settle();

    expect(warnSpy).toHaveBeenCalledWith('[v-phone-mask] Directive can only be used on input elements');

    const target = wrapper.get('[data-test="target"]').element as DirectiveHTMLInputElement;
    expect(target.__phoneMaskState).toBeUndefined();

    wrapper.unmount();
  });

  it('initializes from string country binding', async () => {
    const { wrapper, settle, getInput } = mountInputHost({ bindingValue: 'GB' });
    await settle();

    const input = getInput();
    const state = input.__phoneMaskState;
    expect(state).toBeDefined();
    expect(state?.country.id).toBe('GB');
    expect(input.getAttribute('type')).toBe('tel');
    expect(input.getAttribute('inputmode')).toBe('tel');
    expect(input.getAttribute('placeholder')).toBeTruthy();

    wrapper.unmount();
  });

  it('triggers initial country callback when provided', async () => {
    const onCountryChange = vi.fn();
    const { wrapper, settle, getInput } = mountInputHost({
      bindingValue: { country: 'US', onCountryChange }
    });
    await settle();

    const state = getInput().__phoneMaskState!;
    expect(onCountryChange).toHaveBeenCalledWith(state.country);

    wrapper.unmount();
  });

  it('uses detect flow and falls back to locale country when geo lookup fails', async () => {
    vi.stubGlobal('navigator', { language: 'de-DE' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const { wrapper, settle, getInput } = mountInputHost({
      bindingValue: { detect: true }
    });
    await settle();

    expect(getInput().__phoneMaskState?.country.id).toBe('DE');
    wrapper.unmount();
  });

  it('uses detected geo country when lookup succeeds', async () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ country_code: 'DE' })
      })
    );

    const { wrapper, settle, getInput } = mountInputHost({
      bindingValue: { detect: true }
    });
    await settle();

    expect(getInput().__phoneMaskState?.country.id).toBe('DE');
    wrapper.unmount();
  });

  it('falls back to US when detect flow has no geo and locale region', async () => {
    vi.stubGlobal('navigator', { language: 'en' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const { wrapper, settle, getInput } = mountInputHost({
      bindingValue: { detect: true }
    });
    await settle();

    expect(getInput().__phoneMaskState?.country.id).toBe('US');
    wrapper.unmount();
  });

  it('defaults to US when no country and detect are provided', async () => {
    const { wrapper, settle, getInput } = mountInputHost({
      bindingValue: undefined
    });
    await settle();

    expect(getInput().__phoneMaskState?.country.id).toBe('US');
    wrapper.unmount();
  });

  it('parses initial external value and emits normalized phone payload', async () => {
    const onChange = vi.fn();
    const { wrapper, settle, getInput } = mountInputHost({
      bindingValue: { country: 'US', onChange },
      externalValue: '2025550123456789'
    });
    await settle();

    const input = getInput();
    const state = input.__phoneMaskState!;

    expect(state.digits.length).toBe(state.formatter.getMaxDigits());
    expect(input.value).toBe(state.formatter.formatDisplay(state.digits));

    const payload = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(payload).toBeDefined();
    expect(payload.digits).toBe(state.digits);
    expect(payload.full).toBe(`${state.country.code}${state.digits}`);
    expect(payload.fullFormatted).toBe(`${state.country.code} ${input.value}`);

    wrapper.unmount();
  });

  it('handles input, keydown and paste events through directive listeners', async () => {
    const onChange = vi.fn();
    const { wrapper, settle, getInput } = mountInputHost({
      bindingValue: { country: 'US', onChange }
    });
    await settle();

    const input = getInput();

    input.value = '20255501';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(input.__phoneMaskState?.digits).toBe('20255501');

    const beforeNavDigits = input.__phoneMaskState?.digits;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    await settle();
    expect(input.__phoneMaskState?.digits).toBe(beforeNavDigits);

    input.setSelectionRange(input.value.length, input.value.length);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    await settle();
    expect(input.__phoneMaskState?.digits.length).toBeLessThan((beforeNavDigits ?? '').length);

    const beforePasteNoDigits = input.__phoneMaskState?.digits;
    const noDigitsPaste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(noDigitsPaste, 'clipboardData', {
      value: { getData: () => 'abc()' },
      configurable: true
    });
    input.dispatchEvent(noDigitsPaste);
    await settle();
    expect(input.__phoneMaskState?.digits).toBe(beforePasteNoDigits);

    input.setSelectionRange(1, 1);
    const digitsPaste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(digitsPaste, 'clipboardData', {
      value: { getData: () => '99' },
      configurable: true
    });
    input.dispatchEvent(digitsPaste);
    await settle();

    expect(input.__phoneMaskState?.digits).not.toBe(beforePasteNoDigits);
    expect(onChange).toHaveBeenCalled();

    wrapper.unmount();
  });

  it('updates country from object binding and truncates digits when mask is shorter', async () => {
    const onChange = vi.fn();
    const onCountryChange = vi.fn();
    const { wrapper, settle, getInput, setExternalValue, setBindingValue } = mountInputHost({
      bindingValue: { country: 'US', onChange, onCountryChange }
    });
    await settle();

    await setExternalValue('2025550123');

    const state = getInput().__phoneMaskState!;
    const countries = MasksFull('en');
    const currentCountry = countries.find((country) => country.id === state.country.id)!;
    const currentMaxDigits = createPhoneFormatter(currentCountry).getMaxDigits();
    const candidateIds = ['DE', 'GB', 'FR'];
    const candidateCountries = countries.filter((country) => candidateIds.includes(country.id));
    const shorterCountry = candidateCountries.find(
      (country) => createPhoneFormatter(country).getMaxDigits() < currentMaxDigits
    );
    expect(shorterCountry).toBeDefined();

    await setBindingValue({
      country: shorterCountry!.id,
      onChange,
      onCountryChange
    });

    const updatedState = getInput().__phoneMaskState!;
    expect(updatedState.country.id).toBe(shorterCountry!.id);
    expect(updatedState.digits.length).toBeLessThanOrEqual(updatedState.formatter.getMaxDigits());
    expect(onCountryChange).toHaveBeenCalledWith(updatedState.country);

    wrapper.unmount();
  });

  it('supports string binding updates in updated()', async () => {
    const { wrapper, settle, getInput, setBindingValue } = mountInputHost({
      bindingValue: { country: 'US' }
    });
    await settle();

    await setBindingValue('DE');
    expect(getInput().__phoneMaskState?.country.id).toBe('DE');

    wrapper.unmount();
  });

  it('removes listeners and state on unmount', async () => {
    const { wrapper, settle, getInput } = mountInputHost({
      bindingValue: { country: 'US' }
    });
    await settle();

    const input = getInput();
    const removeListenerSpy = vi.spyOn(input, 'removeEventListener');

    wrapper.unmount();

    expect(removeListenerSpy).toHaveBeenCalledWith('beforeinput', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith('paste', expect.any(Function));
    expect(input.__phoneMaskState).toBeUndefined();
  });
});
