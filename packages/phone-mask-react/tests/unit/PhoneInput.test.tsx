/// <reference types="vitest/globals" />
import { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PhoneInput } from '../../src/components/PhoneInput';
import type { PhoneInputRef } from '../../src/types';

describe('PhoneInput ref API', () => {
  it('exposes imperative methods through forwarded ref', async () => {
    const onChange = vi.fn();
    const inputRef = createRef<PhoneInputRef>();

    render(<PhoneInput ref={inputRef} value="20255501" onChange={onChange} detect={false} />);

    const input = screen.getByRole('textbox');

    expect(inputRef.current).not.toBeNull();

    expect(typeof inputRef.current?.focus).toBe('function');
    expect(typeof inputRef.current?.blur).toBe('function');
    expect(typeof inputRef.current?.clear).toBe('function');
    expect(typeof inputRef.current?.selectCountry).toBe('function');
    expect(typeof inputRef.current?.getFullNumber).toBe('function');
    expect(typeof inputRef.current?.getFullFormattedNumber).toBe('function');
    expect(typeof inputRef.current?.getDigits).toBe('function');
    expect(typeof inputRef.current?.isValid).toBe('function');
    expect(typeof inputRef.current?.isComplete).toBe('function');

    expect(inputRef.current?.getDigits()).toBe('20255501');
    expect(inputRef.current?.getFullNumber()).toBe('+120255501');
    expect(inputRef.current?.getFullFormattedNumber()).toContain('+1');
    expect(typeof inputRef.current?.isComplete()).toBe('boolean');
    expect(inputRef.current?.isValid()).toBe(inputRef.current?.isComplete());

    await act(async () => {
      inputRef.current?.selectCountry('GB');
    });
    await waitFor(() => expect(inputRef.current?.getFullNumber()).toBe('+4420255501'));
    expect(inputRef.current?.getFullFormattedNumber()).toContain('+44');

    await act(async () => {
      inputRef.current?.clear();
    });
    expect(onChange).toHaveBeenCalledWith('');

    await act(async () => {
      inputRef.current?.focus();
    });
    await waitFor(() => expect(document.activeElement).toBe(input));

    await act(async () => {
      inputRef.current?.blur();
    });
    await waitFor(() => expect(document.activeElement).not.toBe(input));
  });

  it('supports clear button and dropdown option interactions', async () => {
    const onChange = vi.fn();
    const onCountryChange = vi.fn();

    const { container } = render(
      <PhoneInput
        value="2025550123"
        onChange={onChange}
        onCountryChange={onCountryChange}
        showClear
        detect={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Selected country:/i }));

    await waitFor(() => {
      expect(document.body.querySelectorAll('.pi-option').length).toBeGreaterThan(0);
    });

    const options = Array.from(document.body.querySelectorAll<HTMLLIElement>('.pi-option'));
    const targetOption = options.find((option) => option.getAttribute('aria-selected') === 'false');
    expect(targetOption).toBeDefined();

    fireEvent.mouseEnter(targetOption!);
    fireEvent.click(targetOption!);

    expect(onCountryChange).toHaveBeenCalled();

    const clearButton = container.querySelector<HTMLButtonElement>('.pi-btn-clear');
    expect(clearButton).toBeDefined();
    fireEvent.click(clearButton!);

    expect(onChange).toHaveBeenCalledWith('');
  });
});
