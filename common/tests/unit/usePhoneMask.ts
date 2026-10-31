/// <reference types="vitest/globals" />
import type { Mock } from 'vitest';
import type { TestTools } from './setup/tools';
import { internationalPasteCases, makePasteEvent } from './setup/paste';
import { deferGeoIp } from './setup/geoip';

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
  detect?: boolean;
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
    it.each(['input', 'clear'] as const)('preserves a user %s when delayed GeoIP resolves', async (edit) => {
      const geoIp = deferGeoIp({ act, waitFor });
      let rendered: UsePhoneMaskSetupResult | undefined;
      try {
        rendered = await setup(edit === 'clear' ? '2025550199' : '', { detect: true });
        const { api, inputEl, onChange, getValue } = rendered;
        await waitFor(() => expect(geoIp.fetch).toHaveBeenCalledOnce());
        await act(async () => {
          if (edit === 'clear') api.clear();
          else {
            inputEl.value = '2025550199';
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          }
          await new Promise<void>((resolve) => setTimeout(resolve));
        });
        const digits = edit === 'clear' ? '' : '2025550199';
        expect(getValue()).toBe(digits);
        inputEl.setSelectionRange(4, 4);
        const caret = inputEl.selectionStart;
        onChange.mockClear();

        await geoIp.resolve('AD');

        expect(api.getCountry()).toBe('US');
        expect(api.getDigits()).toBe(digits);
        expect(getValue()).toBe(digits);
        expect(api.getFull()).toBe(digits ? '+12025550199' : '');
        expect(inputEl.value).toBe(digits ? '202-555-0199' : '');
        expect(inputEl.selectionStart).toBe(caret);
        expect(onChange).not.toHaveBeenCalled();
      } finally {
        rendered?.unmount();
        geoIp.restore();
      }
    });

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

    it.each([
      {
        country: 'AU',
        digits: '412345678',
        display: '412 345 678',
        deletions: [
          { digits: '41345678', display: '413 456 78', caret: 2 },
          { digits: '4145678', display: '41 456 78', caret: 3 }
        ]
      },
      {
        country: 'DE',
        digits: '15123456789',
        display: '1512 3456789',
        deletions: [
          { digits: '1523456789', display: '152 3 456789', caret: 2 },
          { digits: '153456789', display: '153 4 56789', caret: 2 }
        ]
      }
    ])(
      'preserves the digit boundary on consecutive Delete presses in $country',
      async ({ country, digits, display, deletions }) => {
        const { api, inputEl, getValue, unmount } = await setup();
        try {
          await act(() => {
            api.setCountry(country);
          });
          await act(() => {
            inputEl.value = digits;
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          });
          expect(inputEl.value).toBe(display);
          await waitFor(() => expect(inputEl.selectionStart).toBe(display.length));
          inputEl.setSelectionRange(2, 2);

          const deleteAndExpect = async (expected: (typeof deletions)[number]) => {
            await act(() => {
              inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }));
            });
            expect(getValue()).toBe(expected.digits);
            expect(inputEl.value).toBe(expected.display);
            await waitFor(() => {
              expect(inputEl.selectionStart).toBe(expected.caret);
              expect(inputEl.selectionEnd).toBe(expected.caret);
            });
          };
          await deleteAndExpect(deletions[0]);
          await deleteAndExpect(deletions[1]);
        } finally {
          unmount();
        }
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
