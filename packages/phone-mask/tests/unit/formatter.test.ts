/// <reference types="vitest/globals" />
import { describe, expect, it } from 'vitest';
import { createPhoneFormatter } from '../../src/formatter';
import type { MaskFull } from '../../src/entries';

const countryWithMultipleMasks: MaskFull = {
  id: 'AC',
  code: '+9',
  name: 'Testland',
  flag: '🏳️',
  mask: ['###', '###-##']
};

const countryWithoutMask: MaskFull = {
  id: 'AC',
  code: '+0',
  name: 'Noland',
  flag: '🏴',
  mask: []
};

describe('createPhoneFormatter', () => {
  const formatter = createPhoneFormatter(countryWithMultipleMasks);

  it('formats digits with selected variant', () => {
    expect(formatter.formatDisplay('')).toBe('');
    expect(formatter.formatDisplay('12')).toBe('12');
    expect(formatter.formatDisplay('1234')).toBe('123-4');
    expect(formatter.formatDisplay('123456')).toBe('123-45');
  });

  it('returns maximum digits and placeholder', () => {
    expect(formatter.getMaxDigits()).toBe(5);
    expect(formatter.getPlaceholder()).toBe('###');
  });

  it('maps caret position from digit index to display position', () => {
    expect(formatter.getCaretPosition(0)).toBe(0);
    expect(formatter.getCaretPosition(1)).toBe(1);
    expect(formatter.getCaretPosition(4)).toBe(5);
    expect(formatter.getCaretPosition(5)).toBe(6);
    expect(formatter.getCaretPosition(6)).toBe(6);
    expect(formatter.getCaretPosition(-1)).toBe(0);
    expect(formatter.getCaretPosition(99)).toBe(6);
  });

  it('returns digit range from display selection', () => {
    expect(formatter.getDigitRange('1234', 2, 5)).toEqual([2, 4]);
    expect(formatter.getDigitRange('1234', 3, 3)).toBeNull();
    expect(formatter.getDigitRange('1234', 0, 2)).toEqual([0, 2]);
    expect(formatter.getDigitRange('1234', 0, 10)).toEqual([0, 4]);
    expect(formatter.getDigitRange('1234', 5, 10)).toBeNull();
    expect(formatter.getDigitRange('1234', -5, 2)).toEqual([0, 2]);
  });

  it('detects completed number by placeholders', () => {
    expect(formatter.isComplete('12')).toBe(false);
    expect(formatter.isComplete('123')).toBe(true);
    expect(formatter.isComplete('12345')).toBe(true);
    expect(formatter.isComplete('123456')).toBe(false);
  });
});

describe('createPhoneFormatter with no masks', () => {
  const formatter = createPhoneFormatter(countryWithoutMask);

  it('returns empty display and placeholder', () => {
    expect(formatter.formatDisplay('123')).toBe('');
    expect(formatter.getPlaceholder()).toBe('');
  });

  it('returns zero max digits', () => {
    expect(formatter.getMaxDigits()).toBe(0);
  });

  it('maps caret position to zero', () => {
    expect(formatter.getCaretPosition(0)).toBe(0);
    expect(formatter.getCaretPosition(5)).toBe(0);
    expect(formatter.getCaretPosition(-1)).toBe(0);
  });

  it('returns null digit range for any selection', () => {
    expect(formatter.getDigitRange('123', 0, 3)).toBeNull();
    expect(formatter.getDigitRange('123', 1, 2)).toBeNull();
    expect(formatter.getDigitRange('123', -5, 10)).toBeNull();
  });

  it('never detects complete number', () => {
    expect(formatter.isComplete('')).toBe(false);
    expect(formatter.isComplete('123')).toBe(false);
  });
});
