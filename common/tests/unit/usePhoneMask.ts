/// <reference types="vitest/globals" />
import type { Mock } from 'vitest';
import type { TestTools } from './setup/tools';
import { internationalPasteCases, makePasteEvent } from './setup/paste';

export interface UsePhoneMaskSetupResult {
  inputEl: HTMLInputElement;
  onChange: Mock;
  getValue: () => string;
  unmount: () => void;
  api: {
    getCountry: () => string;
    getDigits: () => string;
    getFull: () => string;
    getFullFormatted: () => string;
    isEmpty: () => boolean;
    shouldShowWarn: () => boolean;
    setCountry: (countryCode: string) => boolean | void;
    clear: () => void;
  };
}

export interface UsePhoneMaskSetupOptions {
  attachRef?: boolean;
}

export type UsePhoneMaskSetupFn = (
  initialValue?: string,
  options?: UsePhoneMaskSetupOptions
) => UsePhoneMaskSetupResult | Promise<UsePhoneMaskSetupResult>;

export function testUsePhoneMask(
  setup: UsePhoneMaskSetupFn,
  { act, waitFor }: Pick<TestTools, 'act' | 'waitFor'>
): void {
  describe('usePhoneMask', () => {
    it.each(internationalPasteCases)(
      'detects $country from pasted $text before formatting',
      async ({ text, country, digits, display }) => {
        const { api, inputEl, onChange, getValue, unmount } = await setup('2025550199');
        await act(() => {
          inputEl.setSelectionRange(3, 5);
          inputEl.dispatchEvent(makePasteEvent(text));
        });

        expect(api.getCountry()).toBe(country);
        expect(api.getDigits()).toBe(digits);
        expect(getValue()).toBe(digits);
        expect(inputEl.value).toBe(display);
        expect(onChange).toHaveBeenCalledExactlyOnceWith(digits);
        await waitFor(() => {
          expect(inputEl.selectionStart).toBe(display.length);
          expect(inputEl.selectionEnd).toBe(display.length);
        });
        unmount();
      }
    );

    it('keeps country and inserts a fragment without a calling code at the caret', async () => {
      const { api, inputEl, onChange, getValue, unmount } = await setup('234567');
      await act(() => {
        inputEl.setSelectionRange(4, 4);
        inputEl.dispatchEvent(makePasteEvent('99'));
      });

      expect(api.getCountry()).toBe('US');
      expect(getValue()).toBe('23499567');
      expect(inputEl.value).toBe('234-995-67');
      expect(onChange).toHaveBeenCalledExactlyOnceWith('23499567');
      await waitFor(() => expect(inputEl.selectionStart).toBe(6));
      unmount();
    });

    it('sets tel attrs and syncs formatted display to input element', async () => {
      const { api, inputEl, unmount } = await setup('20255501');

      await act(async () => {});

      expect(inputEl.getAttribute('type')).toBe('tel');
      expect(inputEl.getAttribute('inputmode')).toBe('tel');
      expect(inputEl.getAttribute('placeholder')).toBe('###-###-####');
      expect(inputEl.value).toBe('202-555-01');

      expect(api.getDigits()).toBe('20255501');
      expect(api.getFull()).toBe('+120255501');
      expect(api.getFullFormatted()).toBe('+1 202-555-01');
      expect(api.isEmpty()).toBe(false);
      expect(api.shouldShowWarn()).toBe(true);

      unmount();
    });

    it('handles native input events', async () => {
      const { inputEl, onChange, unmount } = await setup('');

      await act(async () => {});

      await act(() => {
        inputEl.value = '202-555-0199';
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      });
      expect(onChange).toHaveBeenCalledWith('2025550199');
      unmount();
    });

    it('supports clear() and setCountry()', async () => {
      const { api, getValue, onChange, unmount } = await setup('2025550199');

      await act(async () => {});
      expect(api.getFull()).toBe('+12025550199');

      await act(() => {
        api.setCountry('DE');
      });
      expect(api.getFull()).toBe('+492025550199');
      expect(api.getFullFormatted()).toContain('+49');

      await act(() => {
        api.clear();
      });

      expect(onChange).toHaveBeenLastCalledWith('');
      expect(getValue()).toBe('');
      expect(api.isEmpty()).toBe(true);
      unmount();
    });

    it('handles lifecycle when input ref is not attached', async () => {
      const { api, onChange, getValue, unmount } = await setup('202', { attachRef: false });

      await act(async () => {});
      expect(api.getDigits()).toBe('202');
      expect(api.getFull()).toBe('+1202');

      await act(() => {
        api.setCountry('DE');
      });
      expect(api.getFull()).toBe('+49202');

      await act(() => {
        api.clear();
      });
      expect(onChange).toHaveBeenCalledWith('');
      expect(getValue()).toBe('');

      unmount();
    });
  });
}
