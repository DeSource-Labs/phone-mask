/// <reference types="vitest/globals" />
import { describe, expect, it } from 'vitest';
import { createPhoneFormatter } from '../../src/formatter';
import type { MaskFull, CountryKey } from '../../src/entries';

const countryWithMultipleMasks: MaskFull = {
  id: 'XX' as CountryKey,
  code: '+9',
  name: 'Testland',
  flag: '🏳️',
  mask: ['###', '###-##']
};

describe('createPhoneFormatter', () => {
  const formatter = createPhoneFormatter(countryWithMultipleMasks);

  it('formats digits with selected variant', () => {
    expect(formatter.formatDisplay('12')).toBe('12');
    expect(formatter.formatDisplay('1234')).toBe('123-4');
  });

  it('returns maximum digits and placeholder', () => {
    expect(formatter.getMaxDigits()).toBe(5);
    expect(formatter.getPlaceholder()).toBe('###');
  });

  it('maps caret position from digit index to display position', () => {
    expect(formatter.getCaretPosition(0)).toBe(0);
    expect(formatter.getCaretPosition(4)).toBe(5);
    expect(formatter.getCaretPosition(5)).toBe(6);
  });

  it('returns digit range from display selection', () => {
    expect(formatter.getDigitRange('1234', 2, 5)).toEqual([2, 4]);
    expect(formatter.getDigitRange('1234', 3, 3)).toBeNull();
    expect(formatter.getDigitRange('1234', 0, 2)).toEqual([0, 2]);
  });

  it('detects completed number by placeholders', () => {
    expect(formatter.isComplete('12')).toBe(false);
    expect(formatter.isComplete('12345')).toBe(true);
  });
});
