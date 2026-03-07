/// <reference types="vitest/globals" />
import { defineComponent, shallowRef, h } from 'vue';
import { render, fireEvent, screen, waitFor } from '@testing-library/vue';
import { PhoneInput } from '../../src/index';
import type { PhoneInputExposed } from '../../src/types';
import { testPhoneInput } from '@common/tests/unit/PhoneInput';
import { tools } from './setup/tools';
import type { SetupFn } from '@common/tests/unit/PhoneInput';

const setup: SetupFn = async (options = {}) => {
  const onChange = vi.fn();
  const onCountryChange = vi.fn();
  const phoneRef = shallowRef<PhoneInputExposed | null>(null);

  const Wrapper = defineComponent({
    render: () =>
      h(PhoneInput, {
        ref: phoneRef,
        modelValue: options.value ?? '',
        'onUpdate:modelValue': onChange,
        'onCountry-change': onCountryChange,
        detect: options.detect ?? false,
        showClear: options.showClear
      })
  });

  const { container, unmount } = render(Wrapper);

  if (!phoneRef.value) throw new Error('PhoneInput ref is not created');

  return {
    ref: phoneRef.value,
    onChange,
    onCountryChange,
    container,
    unmount
  };
};

testPhoneInput(setup, tools);

describe('PhoneInput template bindings (Vue)', () => {
  it('wires copy/search/input handlers and emits copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    });

    const onModel = vi.fn();
    const onCopy = vi.fn();
    const onCountryChange = vi.fn();

    const { container, unmount } = render(PhoneInput, {
      props: {
        modelValue: '2025550199',
        'onUpdate:modelValue': onModel,
        onCopy,
        'onCountry-change': onCountryChange,
        detect: false
      }
    });

    const input = screen.getByRole('textbox');

    const beforeInput = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: '1'
    });
    input.dispatchEvent(beforeInput);

    input.value = '202-555-0199';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { getData: () => '99' },
      configurable: true
    });
    input.dispatchEvent(pasteEvent);

    const copyButton = container.querySelector<HTMLButtonElement>('.pi-btn-copy');
    expect(copyButton).not.toBeNull();
    await fireEvent.click(copyButton!);

    await waitFor(() => expect(onCopy).toHaveBeenCalled());
    expect(writeText).toHaveBeenCalled();

    await fireEvent.click(screen.getByRole('button', { name: /Selected country:/i }));

    const searchInput = document.body.querySelector<HTMLInputElement>('.pi-search');
    expect(searchInput).not.toBeNull();

    searchInput!.value = 'zzzz-no-country';
    searchInput!.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));

    await waitFor(() => expect(document.body.textContent).toContain('No countries found'));

    expect(onCountryChange).toHaveBeenCalled();

    unmount();
  });
});
