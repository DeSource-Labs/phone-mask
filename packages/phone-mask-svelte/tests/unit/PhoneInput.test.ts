/// <reference types="vitest/globals" />
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import PhoneInput from '../../src/components/PhoneInput.svelte';
import type { PhoneInputExposed } from '../../src/types';
import { testPhoneInput } from '@common/tests/unit/PhoneInput';
import { tools } from './setup/tools.svelte';
import type { SetupFn } from '@common/tests/unit/PhoneInput';

const setup: SetupFn = (options = {}) => {
  const onChange = vi.fn();
  const onCountryChange = vi.fn();

  const { container, unmount, component } = render(PhoneInput, {
    props: {
      value: options.value ?? '',
      detect: options.detect ?? false,
      showClear: options.showClear,
      onchange: (data) => onChange(data.digits),
      oncountrychange: onCountryChange
    }
  });

  const ref = component as unknown as PhoneInputExposed;

  return {
    ref,
    onChange,
    onCountryChange,
    container,
    unmount
  };
};

testPhoneInput(setup, tools);

describe('PhoneInput template bindings (Svelte)', () => {
  it('wires copy/search/input handlers and emits copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    });

    const onCopy = vi.fn();
    const onCountryChange = vi.fn();

    const { container, component, unmount } = render(PhoneInput, {
      props: {
        value: '2025550199',
        detect: false,
        oncopy: onCopy,
        oncountrychange: onCountryChange
      }
    });

    const ref = component as unknown as PhoneInputExposed;
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

    searchInput!.value = '';
    searchInput!.dispatchEvent(new Event('input', { bubbles: true }));
    await waitFor(() => {
      expect(document.body.querySelectorAll('.pi-option').length).toBeGreaterThan(0);
    });

    const firstUnselected = Array.from(document.body.querySelectorAll<HTMLElement>('.pi-option')).find(
      (el) => el.getAttribute('aria-selected') === 'false'
    );
    expect(firstUnselected).toBeDefined();

    firstUnselected!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));

    const dropdown = document.body.querySelector<HTMLElement>('.phone-dropdown');
    expect(dropdown).not.toBeNull();
    dropdown!.dispatchEvent(new Event('animationend', { bubbles: true }));

    await waitFor(() => expect(document.body.querySelector('.phone-dropdown')).toBeNull());
    expect(onCountryChange).toHaveBeenCalled();

    expect(ref.getDigits()).toBeTypeOf('string');

    unmount();
  });
});
