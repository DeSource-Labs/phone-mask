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
  showCopy?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  country?: string;
  disableDefaultStyles?: boolean;
  withCustomRenderers?: boolean;
}

export interface SetupResult {
  ref: PhoneInputRefLike;
  onChange: Mock;
  onCountryChange: Mock;
  onCopy: Mock;
  onFocus: Mock;
  onBlur: Mock;
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

      await fireEvent.click(screen.getByRole('button', { name: /Selected country:/i }));

      await waitFor(() => {
        expect(document.body.querySelectorAll('.pi-option').length).toBeGreaterThan(0);
      });

      const options = Array.from(document.body.querySelectorAll<HTMLLIElement>('.pi-option'));
      const targetOption = options.find((option) => option.getAttribute('aria-selected') === 'false');
      expect(targetOption).toBeDefined();

      await fireEvent.mouseEnter(targetOption!);
      await fireEvent.click(targetOption!);

      expect(onCountryChange).toHaveBeenCalled();

      const clearButton = container.querySelector<HTMLButtonElement>('.pi-btn-clear');
      expect(clearButton).not.toBeNull();
      await fireEvent.click(clearButton!);

      expect(onChange).toHaveBeenCalledWith('');

      unmount();
    });

    it('supports copy/search/input interactions', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true
      });

      const { container, onCopy, unmount } = await setup({
        value: '2025550199',
        detect: false,
        showCopy: true
      });

      const input = screen.getByRole('textbox');
      const beforeInput = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: '1'
      });
      input.dispatchEvent(beforeInput);

      await fireEvent.input(input, { target: { value: '202-555-0199' } });
      await fireEvent.keyDown(input, { key: 'Backspace' });

      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: { getData: () => '99' },
        configurable: true
      });
      input.dispatchEvent(pasteEvent);

      let copyButton!: HTMLButtonElement;
      await waitFor(() => {
        copyButton = container.querySelector<HTMLButtonElement>('.pi-btn-copy')!;
        expect(copyButton).not.toBeNullable();
      });

      await act(async () => {
        await fireEvent.click(copyButton!);
      });

      await waitFor(() => expect(onCopy).toHaveBeenCalled());
      expect(writeText).toHaveBeenCalled();

      await fireEvent.click(screen.getByRole('button', { name: /Selected country:/i }));

      const searchInput = document.body.querySelector<HTMLInputElement>('.pi-search');
      expect(searchInput).not.toBeNull();

      await fireEvent.input(searchInput!, { target: { value: 'zzzz-no-country' } });
      await fireEvent.keyDown(searchInput!, { key: 'ArrowDown' });

      await waitFor(() => expect(document.body.textContent).toContain('No countries found'));

      unmount();
    });

    it('applies disabled/readonly/fixed-country visual state', async () => {
      const { container, unmount } = await setup({
        value: '2025550199',
        detect: false,
        showClear: true,
        disabled: true,
        readonly: true,
        country: 'US',
        disableDefaultStyles: true
      });

      const root = container.querySelector('.phone-input');
      expect(root).not.toBeNull();
      expect(root?.className).toContain('is-disabled');
      expect(root?.className).toContain('is-readonly');
      expect(root?.className).toContain('is-unstyled');

      const selectorButton = container.querySelector<HTMLButtonElement>('.pi-selector-btn');
      expect(selectorButton).not.toBeNull();
      expect(selectorButton?.className).toContain('no-dropdown');
      expect(selectorButton?.disabled).toBe(true);
      expect(selectorButton?.getAttribute('tabindex')).toBe('-1');

      // Disabled inputs hide actionable buttons regardless of value.
      expect(container.querySelector('.pi-btn-copy')).toBeNull();
      expect(container.querySelector('.pi-btn-clear')).toBeNull();

      unmount();
    });

    it('hides copy action when showCopy is disabled', async () => {
      const { container, unmount } = await setup({
        value: '2025550199',
        detect: false,
        showCopy: false
      });

      expect(container.querySelector('.pi-btn-copy')).toBeNull();
      unmount();
    });

    it('supports custom renderers and focus/blur callbacks', async () => {
      const { onFocus, onBlur, unmount } = await setup({
        value: '2025550199',
        detect: false,
        showClear: true,
        showCopy: true,
        withCustomRenderers: true
      });

      const input = screen.getByRole('textbox');
      await fireEvent.focus(input);
      await fireEvent.blur(input);

      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onBlur).toHaveBeenCalledTimes(1);

      expect(document.body.querySelector('[data-testid="actions-before"]')).not.toBeNull();
      expect(document.body.querySelector('[data-testid="copy-custom"]')).not.toBeNull();
      expect(document.body.querySelector('[data-testid="clear-custom"]')).not.toBeNull();
      expect(document.body.querySelector('[data-testid="flag-custom"]')).not.toBeNull();

      await fireEvent.click(screen.getByRole('button', { name: /Selected country:/i }));

      await waitFor(() => {
        expect(document.body.querySelector('.phone-dropdown.custom-dropdown')).not.toBeNull();
      });

      expect(document.body.querySelectorAll('[data-testid="flag-custom"]').length).toBeGreaterThan(0);
      unmount();
    });
  });
}
