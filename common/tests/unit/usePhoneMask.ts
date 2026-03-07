/// <reference types="vitest/globals" />
import type { Mock } from 'vitest';
import type { TestTools } from './setup/tools';

export interface UsePhoneMaskSetupResult {
  inputEl: HTMLInputElement;
  onChange: Mock;
  getValue: () => string;
  unmount: () => void;
  api: {
    getDigits: () => string;
    getFull: () => string;
    getFullFormatted: () => string;
    isEmpty: () => boolean;
    shouldShowWarn: () => boolean;
    setCountry: (countryCode: string) => boolean | void;
    clear: () => void;
  };
}

export type UsePhoneMaskSetupFn = (initialValue?: string) => UsePhoneMaskSetupResult | Promise<UsePhoneMaskSetupResult>;

export function testUsePhoneMask(setup: UsePhoneMaskSetupFn, { act }: Pick<TestTools, 'act'>): void {
  describe('usePhoneMask', () => {
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

      await act(async () => {
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

      await act(async () => {
        api.setCountry('DE');
      });
      expect(api.getFull()).toBe('+492025550199');
      expect(api.getFullFormatted()).toContain('+49');

      await act(async () => {
        api.clear();
      });

      expect(onChange).toHaveBeenLastCalledWith('');
      expect(getValue()).toBe('');
      expect(api.isEmpty()).toBe(true);
      unmount();
    });
  });
}
