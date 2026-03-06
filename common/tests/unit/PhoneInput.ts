/// <reference types="vitest/globals" />
import type { TestTools } from './setup/tools';

import type { Mock } from 'vitest';

export interface PhoneInputRefLike {
  focus(): void;
  blur(): void;
  clear(): void;
  selectCountry(code: string): void;
  getFullNumber(): string;
  getFullFormattedNumber(): string;
  getDigits(): string;
  isValid(): boolean;
  isComplete(): boolean;
}

export interface SetupOptions {
  value?: string;
  detect?: boolean;
  showClear?: boolean;
}

export interface SetupResult {
  ref: PhoneInputRefLike;
  onChange: Mock;
  onCountryChange: Mock;
  container: Element;
  unmount(): void;
}

export type SetupFn = (options?: SetupOptions) => SetupResult | Promise<SetupResult>;

export function testPhoneInput(setup: SetupFn, { act, screen, fireEvent, waitFor }: TestTools): void {
  describe('PhoneInput API', () => {
    it('exposes imperative methods through ref', async () => {
      const { ref, onChange, unmount } = await setup({ value: '20255501', detect: false });
      const input = screen.getByRole('textbox');

      expect(typeof ref.focus).toBe('function');
      expect(typeof ref.blur).toBe('function');
      expect(typeof ref.clear).toBe('function');
      expect(typeof ref.selectCountry).toBe('function');
      expect(typeof ref.getFullNumber).toBe('function');
      expect(typeof ref.getFullFormattedNumber).toBe('function');
      expect(typeof ref.getDigits).toBe('function');
      expect(typeof ref.isValid).toBe('function');
      expect(typeof ref.isComplete).toBe('function');

      expect(ref.getDigits()).toBe('20255501');
      expect(ref.getFullNumber()).toBe('+120255501');
      expect(ref.getFullFormattedNumber()).toContain('+1');
      expect(typeof ref.isComplete()).toBe('boolean');
      expect(ref.isValid()).toBe(ref.isComplete());

      await act(async () => {
        ref.selectCountry('GB');
      });
      await waitFor(() => expect(ref.getFullNumber()).toBe('+4420255501'));
      expect(ref.getFullFormattedNumber()).toContain('+44');

      await act(async () => {
        ref.clear();
      });
      expect(onChange).toHaveBeenCalledWith('');

      await act(async () => {
        ref.focus();
      });
      await waitFor(() => expect(document.activeElement).toBe(input));

      await act(async () => {
        ref.blur();
      });
      await waitFor(() => expect(document.activeElement).not.toBe(input));

      unmount();
    });

    it('supports clear button and dropdown option interactions', async () => {
      const { container, onChange, onCountryChange, unmount } = await setup({
        value: '2025550123',
        detect: false,
        showClear: true
      });

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
      expect(clearButton).not.toBeNull();
      fireEvent.click(clearButton!);

      expect(onChange).toHaveBeenCalledWith('');

      unmount();
    });
  });
}
