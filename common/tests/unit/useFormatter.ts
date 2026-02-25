/// <reference types="vitest/globals" />
import type { Mock } from 'vitest';

import type { TestTools } from './setup/tools';

type MaybeRef<T> = T | { value: T };

export interface SetupOptions {
  /** Country code string, e.g. 'US', 'GB'. Defaults to 'US'. */
  countryCode?: string;
  /** Initial digits value. Defaults to ''. */
  value?: string;
}

export interface FormatterSetupResult {
  result: {
    digits: MaybeRef<string>;
    displayPlaceholder: MaybeRef<string>;
    displayValue: MaybeRef<string>;
    full: MaybeRef<string>;
    fullFormatted: MaybeRef<string>;
    isComplete: MaybeRef<boolean>;
    isEmpty: MaybeRef<boolean>;
    shouldShowWarn: MaybeRef<boolean>;
  };
  unmount: () => void;
  rerender: (props: SetupOptions) => void;
  onChange: Mock;
  onPhoneChange: Mock;
  onValidationChange: Mock;
}

export type SetupFn = (options?: SetupOptions) => FormatterSetupResult;

// US: code = '+1', mask = '###-###-####', maxDigits = 10
const US_CODE = '+1';
const US_PARTIAL = '23456'; // 5 digits — valid, incomplete
const US_COMPLETE = '2345678901'; // 10 digits — complete
const US_EXCESS = '23456789011'; // 11 digits — must be clamped to 10

export function testUseFormatter(setup: SetupFn, { act, toValue }: TestTools): void {
  describe('useFormatter', () => {
    describe('initial state — empty value', () => {
      it('digits is empty string', () => {
        const { result, unmount } = setup();
        expect(toValue(result.digits)).toBe('');
        unmount();
      });

      it('isEmpty is true', () => {
        const { result, unmount } = setup();
        expect(toValue(result.isEmpty)).toBe(true);
        unmount();
      });

      it('isComplete is false', () => {
        const { result, unmount } = setup();
        expect(toValue(result.isComplete)).toBe(false);
        unmount();
      });

      it('shouldShowWarn is false when empty', () => {
        const { result, unmount } = setup();
        expect(toValue(result.shouldShowWarn)).toBe(false);
        unmount();
      });

      it('full is empty string', () => {
        const { result, unmount } = setup();
        expect(toValue(result.full)).toBe('');
        unmount();
      });

      it('fullFormatted is empty string', () => {
        const { result, unmount } = setup();
        expect(toValue(result.fullFormatted)).toBe('');
        unmount();
      });

      it('displayPlaceholder is non-empty', () => {
        const { result, unmount } = setup();
        expect(toValue(result.displayPlaceholder)).toBeTruthy();
        unmount();
      });

      it('displayValue is empty string', () => {
        const { result, unmount } = setup();
        expect(toValue(result.displayValue)).toBe('');
        unmount();
      });
    });

    describe('initial state — partial value', () => {
      it('digits equals the provided value', () => {
        const { result, unmount } = setup({ value: US_PARTIAL });
        expect(toValue(result.digits)).toBe(US_PARTIAL);
        unmount();
      });

      it('isEmpty is false', () => {
        const { result, unmount } = setup({ value: US_PARTIAL });
        expect(toValue(result.isEmpty)).toBe(false);
        unmount();
      });

      it('isComplete is false', () => {
        const { result, unmount } = setup({ value: US_PARTIAL });
        expect(toValue(result.isComplete)).toBe(false);
        unmount();
      });

      it('shouldShowWarn is true', () => {
        const { result, unmount } = setup({ value: US_PARTIAL });
        expect(toValue(result.shouldShowWarn)).toBe(true);
        unmount();
      });

      it('full is country code concatenated with digits', () => {
        const { result, unmount } = setup({ value: US_PARTIAL });
        expect(toValue(result.full)).toBe(`${US_CODE}${US_PARTIAL}`);
        unmount();
      });

      it('fullFormatted starts with country code followed by a space', () => {
        const { result, unmount } = setup({ value: US_PARTIAL });
        expect(toValue(result.fullFormatted)).toMatch(/^\+1 /);
        unmount();
      });

      it('displayValue is non-empty', () => {
        const { result, unmount } = setup({ value: US_PARTIAL });
        expect(toValue(result.displayValue)).toBeTruthy();
        unmount();
      });
    });

    describe('initial state — complete value', () => {
      it('isComplete is true', () => {
        const { result, unmount } = setup({ value: US_COMPLETE });
        expect(toValue(result.isComplete)).toBe(true);
        unmount();
      });

      it('shouldShowWarn is false when complete', () => {
        const { result, unmount } = setup({ value: US_COMPLETE });
        expect(toValue(result.shouldShowWarn)).toBe(false);
        unmount();
      });

      it('digits equals the complete value', () => {
        const { result, unmount } = setup({ value: US_COMPLETE });
        expect(toValue(result.digits)).toBe(US_COMPLETE);
        unmount();
      });

      it('full is country code concatenated with complete digits', () => {
        const { result, unmount } = setup({ value: US_COMPLETE });
        expect(toValue(result.full)).toBe(`${US_CODE}${US_COMPLETE}`);
        unmount();
      });
    });

    describe('digits clamping', () => {
      it('clamps digits to maxDigits when value exceeds it', () => {
        const { result, unmount } = setup({ value: US_EXCESS });
        expect(toValue(result.digits)).toBe(US_COMPLETE);
        unmount();
      });

      it('calls onChange with clamped digits when value exceeds maxDigits', () => {
        const { onChange, unmount } = setup({ value: US_EXCESS });
        expect(onChange).toHaveBeenCalledWith(US_COMPLETE);
        unmount();
      });

      it('does not call onChange when value is empty', () => {
        const { onChange, unmount } = setup({ value: '' });
        expect(onChange).not.toHaveBeenCalled();
        unmount();
      });

      it('does not call onChange for a valid partial value', () => {
        const { onChange, unmount } = setup({ value: US_PARTIAL });
        expect(onChange).not.toHaveBeenCalled();
        unmount();
      });

      it('does not call onChange for a valid complete value', () => {
        const { onChange, unmount } = setup({ value: US_COMPLETE });
        expect(onChange).not.toHaveBeenCalled();
        unmount();
      });

      it('calls onChange when rerendered value exceeds maxDigits', async () => {
        const { onChange, rerender, unmount } = setup({ value: US_PARTIAL });

        await act(async () => {
          rerender({ value: US_EXCESS });
        });

        expect(onChange).toHaveBeenCalledWith(US_COMPLETE);
        unmount();
      });
    });

    describe('value reactivity', () => {
      it('updates isComplete when value changes from partial to complete', async () => {
        const { result, rerender, unmount } = setup({ value: US_PARTIAL });

        expect(toValue(result.isComplete)).toBe(false);

        await act(async () => {
          rerender({ value: US_COMPLETE });
        });

        expect(toValue(result.isComplete)).toBe(true);
        unmount();
      });

      it('updates isEmpty when value changes from empty to partial', async () => {
        const { result, rerender, unmount } = setup({ value: '' });

        expect(toValue(result.isEmpty)).toBe(true);

        await act(async () => {
          rerender({ value: US_PARTIAL });
        });

        expect(toValue(result.isEmpty)).toBe(false);
        unmount();
      });

      it('updates shouldShowWarn when value changes from partial to complete', async () => {
        const { result, rerender, unmount } = setup({ value: US_PARTIAL });

        expect(toValue(result.shouldShowWarn)).toBe(true);

        await act(async () => {
          rerender({ value: US_COMPLETE });
        });

        expect(toValue(result.shouldShowWarn)).toBe(false);
        unmount();
      });

      it('updates full when value changes from empty to partial', async () => {
        const { result, rerender, unmount } = setup({ value: '' });

        expect(toValue(result.full)).toBe('');

        await act(async () => {
          rerender({ value: US_PARTIAL });
        });

        expect(toValue(result.full)).toBe(`${US_CODE}${US_PARTIAL}`);
        unmount();
      });

      it('clears full and fullFormatted when value changes back to empty', async () => {
        const { result, rerender, unmount } = setup({ value: US_PARTIAL });

        expect(toValue(result.full)).not.toBe('');

        await act(async () => {
          rerender({ value: '' });
        });

        expect(toValue(result.full)).toBe('');
        expect(toValue(result.fullFormatted)).toBe('');
        unmount();
      });
    });

    describe('country reactivity', () => {
      it('updates displayPlaceholder when country changes', async () => {
        const { result, rerender, unmount } = setup({ countryCode: 'US', value: '' });

        const usPlaceholder = toValue(result.displayPlaceholder);

        await act(async () => {
          rerender({ countryCode: 'GB' });
        });

        expect(toValue(result.displayPlaceholder)).not.toBe(usPlaceholder);
        unmount();
      });

      it('updates full country code prefix when country changes', async () => {
        const { result, rerender, unmount } = setup({ countryCode: 'US', value: US_PARTIAL });

        expect(toValue(result.full)).toMatch(/^\+1/);

        await act(async () => {
          rerender({ countryCode: 'GB' });
        });

        expect(toValue(result.full)).toMatch(/^\+44/);
        unmount();
      });

      it('clamps digits and calls onChange when country change lowers maxDigits', async () => {
        // Use a country with very few digits to ensure clamping occurs.
        // Andorra (AD) uses '+376' and has a short mask.
        const { onChange, rerender, unmount } = setup({ countryCode: 'US', value: US_COMPLETE });

        onChange.mockClear();

        await act(async () => {
          rerender({ countryCode: 'AD' });
        });

        // Andorra maxDigits < 10, so US_COMPLETE must be clamped
        expect(onChange).toHaveBeenCalledOnce();
        unmount();
      });
    });

    describe('onPhoneChange callback', () => {
      it('is called on mount with initial phone data', () => {
        const { onPhoneChange, unmount } = setup({ value: US_PARTIAL });

        expect(onPhoneChange).toHaveBeenCalledOnce();
        expect(onPhoneChange).toHaveBeenCalledWith({
          digits: US_PARTIAL,
          full: `${US_CODE}${US_PARTIAL}`,
          fullFormatted: expect.stringMatching(/^\+1 /)
        });
        unmount();
      });

      it('is called with empty strings when value is empty', () => {
        const { onPhoneChange, unmount } = setup({ value: '' });

        expect(onPhoneChange).toHaveBeenCalledWith({
          digits: '',
          full: '',
          fullFormatted: ''
        });
        unmount();
      });

      it('is called again when value changes', async () => {
        const { onPhoneChange, rerender, unmount } = setup({ value: US_PARTIAL });

        onPhoneChange.mockClear();

        await act(async () => {
          rerender({ value: US_COMPLETE });
        });

        expect(onPhoneChange).toHaveBeenCalledWith({
          digits: US_COMPLETE,
          full: `${US_CODE}${US_COMPLETE}`,
          fullFormatted: expect.stringMatching(/^\+1 /)
        });
        unmount();
      });
    });

    describe('onValidationChange callback', () => {
      it('is called on mount with false when value is empty', () => {
        const { onValidationChange, unmount } = setup({ value: '' });
        expect(onValidationChange).toHaveBeenCalledWith(false);
        unmount();
      });

      it('is called on mount with true when value is complete', () => {
        const { onValidationChange, unmount } = setup({ value: US_COMPLETE });
        expect(onValidationChange).toHaveBeenCalledWith(true);
        unmount();
      });

      it('is called with true when value changes to complete', async () => {
        const { onValidationChange, rerender, unmount } = setup({ value: US_PARTIAL });

        onValidationChange.mockClear();

        await act(async () => {
          rerender({ value: US_COMPLETE });
        });

        expect(onValidationChange).toHaveBeenCalledWith(true);
        unmount();
      });

      it('is called with false when value changes from complete to partial', async () => {
        const { onValidationChange, rerender, unmount } = setup({ value: US_COMPLETE });

        onValidationChange.mockClear();

        await act(async () => {
          rerender({ value: US_PARTIAL });
        });

        expect(onValidationChange).toHaveBeenCalledWith(false);
        unmount();
      });
    });

    describe('fullFormatted construction', () => {
      it('is empty string when GB country and empty value', () => {
        const { result, unmount } = setup({ countryCode: 'GB', value: '' });
        expect(toValue(result.fullFormatted)).toBe('');
        unmount();
      });

      it('starts with GB code when GB country and partial value', () => {
        const { result, unmount } = setup({ countryCode: 'GB', value: '7911123' });
        expect(toValue(result.fullFormatted)).toMatch(/^\+44 /);
        expect(toValue(result.full)).toMatch(/^\+44/);
        unmount();
      });
    });
  });
}
