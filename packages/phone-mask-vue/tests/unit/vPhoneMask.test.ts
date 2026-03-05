/// <reference types="vitest/globals" />
import { defineComponent, nextTick, ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { vPhoneMask } from '../../src/directives/vPhoneMask';
import type { DirectiveHTMLInputElement } from '../../src/types';

function mountDirectiveHost(onChange: (phone: { digits: string }) => void) {
  const options = ref({
    country: 'US',
    onChange
  });
  const externalValue = ref('');

  const Host = defineComponent({
    setup() {
      return {
        options,
        externalValue
      };
    },
    template: '<input data-test="phone" v-phone-mask="options" :value="externalValue" />'
  });

  const wrapper = mount(Host, {
    global: {
      directives: {
        phoneMask: vPhoneMask
      }
    }
  });

  const getInput = () => wrapper.get('[data-test="phone"]').element as DirectiveHTMLInputElement;
  const setExternalValue = async (value: string) => {
    externalValue.value = value;
    await nextTick();
    await flushPromises();
  };

  return { wrapper, getInput, setExternalValue };
}

describe('vPhoneMask directive', () => {
  it('clamps external value updates to formatter max digits in updated()', async () => {
    const onChange = vi.fn();
    const { wrapper, getInput, setExternalValue } = mountDirectiveHost(onChange);
    await flushPromises();
    await nextTick();

    const initialState = getInput().__phoneMaskState;
    expect(initialState).toBeDefined();

    const maxDigits = initialState!.formatter.getMaxDigits();
    expect(maxDigits).toBeGreaterThan(0);

    await setExternalValue('12345678901234567890');

    const updatedInput = getInput();
    const updatedState = updatedInput.__phoneMaskState!;
    expect(updatedState.digits.length).toBe(maxDigits);

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(lastCall).toBeDefined();
    expect(lastCall.digits).toBe(updatedState.digits);
    expect(lastCall.digits.length).toBe(maxDigits);

    wrapper.unmount();
  });

  it('normalizes an overlong external write even when clamped digits are unchanged', async () => {
    const onChange = vi.fn();
    const { wrapper, getInput, setExternalValue } = mountDirectiveHost(onChange);
    await flushPromises();
    await nextTick();

    await setExternalValue('1234567890');

    const inputAfterFirstUpdate = getInput();
    const stateAfterFirstUpdate = inputAfterFirstUpdate.__phoneMaskState!;
    const expectedDisplay = stateAfterFirstUpdate.formatter.formatDisplay(stateAfterFirstUpdate.digits);
    expect(stateAfterFirstUpdate.digits).toBe('1234567890');
    expect(inputAfterFirstUpdate.value).toBe(expectedDisplay);

    await setExternalValue('1234567890123');

    const inputAfterSecondUpdate = getInput();
    const stateAfterSecondUpdate = inputAfterSecondUpdate.__phoneMaskState!;
    expect(stateAfterSecondUpdate.digits).toBe('1234567890');
    expect(inputAfterSecondUpdate.value).toBe(expectedDisplay);

    wrapper.unmount();
  });
});
