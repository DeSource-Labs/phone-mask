/// <reference types="vitest/globals" />
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import {
  extractDigits,
  getSelection,
  setCaret,
  processBeforeInput,
  processInput,
  processKeydown,
  processPaste
} from '@src/handlers';
import { createPhoneFormatter } from '@src/formatter';
import type { CountryKey } from '@src/entries';

const createFormatter = () =>
  createPhoneFormatter({
    id: 'XX' as CountryKey,
    name: 'Testland',
    code: '+9',
    flag: '🏳️',
    mask: ['#-##-##']
  });

const createInput = (value = '') => {
  const input = document.createElement('input');
  input.value = value;
  return input;
};

const createBeforeInputEvent = (target: HTMLInputElement | null, data: string, inputType = 'insertText') =>
  ({ target, data, inputType, preventDefault: vi.fn() }) as unknown as InputEvent;

const createKeyboardEvent = (
  target: HTMLInputElement | null,
  key: string | undefined,
  modifiers: Partial<Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey'>> = {}
) =>
  ({
    target,
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    ...modifiers,
    preventDefault: vi.fn()
  }) as unknown as KeyboardEvent;

const createPasteEvent = (target: HTMLInputElement | null, text?: string) =>
  ({
    target,
    clipboardData: text === undefined ? undefined : { getData: () => text },
    preventDefault: vi.fn()
  }) as unknown as ClipboardEvent;

describe('core handlers: digit helpers', () => {
  it('extracts and limits digits', () => {
    expect(extractDigits('+1 (234) 567-890', 5)).toBe('12345');
    expect(extractDigits('abc123')).toBe('123');
  });

  it('reads and sets input selection', () => {
    const input = createInput('123-45');
    input.setSelectionRange(2, 4);
    expect(getSelection(input)).toEqual([2, 4]);
    expect(getSelection(null)).toEqual([0, 0]);

    setCaret(input, 3);
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(3);
  });

  it('handles null selection values and null elements', () => {
    const nonTextInput = document.createElement('input');
    nonTextInput.type = 'checkbox';
    expect(getSelection(nonTextInput)).toEqual([0, 0]);

    expect(() => setCaret(null, 3)).not.toThrow();
  });
});

describe('processBeforeInput', () => {
  it('returns early when event target is missing', () => {
    const event = createBeforeInputEvent(null, '1');

    processBeforeInput(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('blocks invalid chars and double spaces', () => {
    const input = createInput('1 ');
    const event = createBeforeInputEvent(input, ' ');

    processBeforeInput(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('blocks invalid symbols', () => {
    const input = document.createElement('input');
    const event = createBeforeInputEvent(input, '@');

    processBeforeInput(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('allows a single space when the current value does not end with space', () => {
    const input = createInput('1');
    const event = createBeforeInputEvent(input, ' ');

    processBeforeInput(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('ignores non-insert text input events', () => {
    const input = document.createElement('input');
    const event = createBeforeInputEvent(input, '1', 'deleteContentBackward');

    processBeforeInput(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});

describe('processInput', () => {
  it.each([
    { name: 'an empty input', value: '', caret: 0, digits: '', digitIndex: 0 },
    { name: 'the first digit', value: '9', caret: 1, digits: '9', digitIndex: 1 },
    { name: 'insertion at the start', value: '9202-555-01', caret: 1, digits: '920255501', digitIndex: 1 },
    { name: 'insertion before a separator', value: '2029-555-01', caret: 4, digits: '202955501', digitIndex: 4 },
    { name: 'insertion after a separator', value: '202-9555-01', caret: 5, digits: '202955501', digitIndex: 4 },
    { name: 'insertion within a digit group', value: '202-5955-01', caret: 6, digits: '202595501', digitIndex: 5 },
    { name: 'insertion at the end', value: '202-555-019', caret: 11, digits: '202555019', digitIndex: 9 },
    { name: 'multiple inserted digits', value: '202-98555-01', caret: 6, digits: '2029855501', digitIndex: 5 },
    { name: 'selection replacement', value: '202-985-0123', caret: 6, digits: '2029850123', digitIndex: 5 },
    { name: 'full replacement', value: '98', caret: 2, digits: '98', digitIndex: 2 },
    { name: 'filtered characters', value: '202-9x 8555-01', caret: 8, digits: '2029855501', digitIndex: 5 },
    { name: 'only separators', value: '()- ', caret: 3, digits: '', digitIndex: 0 },
    { name: 'a caret at zero', value: '202-555-01', caret: 0, digits: '20255501', digitIndex: 0 },
    { name: 'overflow after the caret', value: '202-987555-0123', caret: 7, digits: '2029875550', digitIndex: 6 },
    { name: 'overflow before the caret', value: '202-555-0123987', caret: 15, digits: '2025550123', digitIndex: 10 }
  ])('preserves the digit boundary for $name', ({ value, caret, digits, digitIndex }) => {
    const formatter = createPhoneFormatter({ mask: ['###-###-####'] });
    const input = createInput(value);
    input.setSelectionRange(caret, caret);

    expect(processInput({ target: input } as unknown as Event, { formatter })).toEqual({
      newDigits: digits,
      caretDigitIndex: digitIndex
    });
  });

  it.each([
    { value: '129-34', caret: 3, digits: '12934', digitIndex: 3, display: '(129) 34', formattedCaret: 6 },
    { value: '(19) 45', caret: 3, digits: '1945', digitIndex: 2, display: '19-45', formattedCaret: 3 }
  ])('preserves the inserted digit boundary when the mask changes for $value', (testCase) => {
    const formatter = createPhoneFormatter({ mask: ['##-##', '(###) ###'] });
    const input = createInput(testCase.value);
    input.setSelectionRange(testCase.caret, testCase.caret);

    const result = processInput({ target: input } as unknown as Event, { formatter });

    expect(result).toEqual({ newDigits: testCase.digits, caretDigitIndex: testCase.digitIndex });
    expect(formatter.formatDisplay(result!.newDigits)).toBe(testCase.display);
    expect(formatter.getCaretPosition(result!.caretDigitIndex, result!.newDigits.length)).toBe(testCase.formattedCaret);
  });

  it('falls back to the end when the input does not support selection', () => {
    const formatter = createFormatter();
    const input = createInput('123456');
    input.type = 'number';
    expect(input.selectionStart).toBeNull();

    expect(processInput({ target: input } as unknown as Event, { formatter })).toEqual({
      newDigits: '12345',
      caretDigitIndex: 5
    });
  });

  it('extracts digits and clamps to max count', () => {
    const formatter = createFormatter();
    const input = createInput('1234-56');

    const result = processInput({ target: input } as unknown as Event, { formatter });
    expect(result?.newDigits).toBe('12345');
    expect(result?.caretDigitIndex).toBe(5);
  });

  it('returns undefined when target is missing', () => {
    const formatter = createFormatter();
    expect(processInput({ target: null } as unknown as Event, { formatter })).toBeUndefined();
  });
});

describe('processKeydown', () => {
  it('returns undefined when target is missing', () => {
    const formatter = createFormatter();
    const event = createKeyboardEvent(null, 'Backspace');

    expect(processKeydown(event, { digits: '12345', formatter })).toBeUndefined();
  });

  it('allows shortcut keys with modifiers', () => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12345'));
    input.setSelectionRange(1, 1);

    const event = createKeyboardEvent(input, 'a', { ctrlKey: true });

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(result).toBeUndefined();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('removes selected digits', () => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12345'));
    input.setSelectionRange(0, 1); // Select the first digit '1'

    const event = createKeyboardEvent(input, 'Backspace');

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ newDigits: '2345', caretDigitIndex: 0 });
  });

  it.each([
    {
      name: 'handles Backspace selection ranges that contain only delimiters',
      key: 'Backspace',
      expected: { newDigits: '2345', caretDigitIndex: 0 }
    },
    {
      name: 'handles Delete selection ranges that contain only delimiters',
      key: 'Delete',
      expected: { newDigits: '1345', caretDigitIndex: 1 }
    }
  ])('$name', ({ key, expected }) => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12345'));
    input.setSelectionRange(1, 2);

    const result = processKeydown(createKeyboardEvent(input, key), { digits: '12345', formatter });
    expect(result).toEqual(expected);
  });

  it.each([
    { name: 'deletes previous digit when caret on delimiter', key: 'Backspace', newDigits: '2345' },
    { name: 'deletes next digit for Delete when caret on delimiter', key: 'Delete', newDigits: '1345' }
  ])('$name', ({ key, newDigits }) => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12345'));
    // Position 1 is the separator in `1-23-45`.
    input.setSelectionRange(1, 1);

    const result = processKeydown(createKeyboardEvent(input, key), { digits: '12345', formatter });
    expect(result?.newDigits).toBe(newDigits);
  });

  it('skips delimiters when caret is after a delimiter on Backspace', () => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12345'));
    // `1-23-45`: index 2 is just after delimiter '-'
    input.setSelectionRange(2, 2);

    const event = createKeyboardEvent(input, 'Backspace');

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(result?.newDigits).toBe('2345');
    expect(result?.caretDigitIndex).toBe(0);
  });

  it('blocks digits after max length', () => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12345'));
    input.setSelectionRange(5, 5);

    const event = createKeyboardEvent(input, '6');

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it.each([
    { name: 'one selected digit', selection: [6, 7], blocked: false },
    { name: 'digits and delimiters', selection: [2, 6], blocked: false },
    { name: 'the entire number', selection: [0, 7], blocked: false },
    { name: 'only a delimiter', selection: [1, 2], blocked: true }
  ])('handles typing over $name at max length', ({ selection, blocked }) => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12345'));
    input.setSelectionRange(selection[0], selection[1]);
    const event = createKeyboardEvent(input, '9');

    expect(processKeydown(event, { digits: '12345', formatter })).toBeUndefined();
    expect(event.preventDefault).toHaveBeenCalledTimes(blocked ? 1 : 0);
  });

  it('returns undefined for Backspace at start with no selection', () => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12345'));
    input.setSelectionRange(0, 0);

    const event = createKeyboardEvent(input, 'Backspace');

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it('returns undefined for Backspace when no previous digit can be resolved', () => {
    const formatter = createFormatter();
    const input = createInput('-');
    input.setSelectionRange(1, 1);

    const event = createKeyboardEvent(input, 'Backspace');

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(result).toBeUndefined();
  });

  it('returns undefined for Backspace when digit range cannot be mapped', () => {
    const formatter = createFormatter();
    const input = createInput('x');
    input.setSelectionRange(1, 1);

    const event = createKeyboardEvent(input, 'Backspace');

    const result = processKeydown(event, { digits: '', formatter });
    expect(result).toBeUndefined();
  });

  it('deletes selected digits for Delete key', () => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12345'));
    input.setSelectionRange(0, 3);

    const event = createKeyboardEvent(input, 'Delete');

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(result).toEqual({ newDigits: '345', caretDigitIndex: 0 });
  });

  it('returns undefined for Delete at the end', () => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12345'));
    input.setSelectionRange(input.value.length, input.value.length);

    const event = createKeyboardEvent(input, 'Delete');

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it('returns undefined for Delete when no next digit can be mapped', () => {
    const formatter = createFormatter();
    const input = createInput('x');
    input.setSelectionRange(0, 0);

    const event = createKeyboardEvent(input, 'Delete');

    const result = processKeydown(event, { digits: '', formatter });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it.each([
    { name: 'blocks non-numeric single characters', key: 'a', preventDefaultCalls: 1 },
    { name: 'does not block multi-character non-navigation keys', key: 'F1', preventDefaultCalls: 0 },
    { name: 'allows numeric input when below max digits', key: '3', preventDefaultCalls: 0 }
  ])('$name', ({ key, preventDefaultCalls }) => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12'));
    input.setSelectionRange(2, 2);

    const event = createKeyboardEvent(input, key);

    const result = processKeydown(event, { digits: '12', formatter });
    expect(event.preventDefault).toHaveBeenCalledTimes(preventDefaultCalls);
    expect(result).toBeUndefined();
  });

  it('does not throw when keyboard event key is missing, e.g. autocomplete', () => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12'));
    input.setSelectionRange(2, 2);

    const event = createKeyboardEvent(input, undefined);

    expect(() => processKeydown(event, { digits: '12', formatter })).not.toThrow();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});

describe('processPaste', () => {
  it.each([
    ['+7 12345 6 77 88', 'KZ', '1234567788'],
    ['+71234567788', 'RU', '1234567788'],
    ['+4915123456789', 'DE', '15123456789'],
    ['+39 06 1234 5678', 'IT', '0612345678'],
    ['+11234567890', 'US', '1234567890']
  ])('replaces the entire value for detected international paste %s', (text, country, newDigits) => {
    const formatter = createFormatter(); // Five digits: must not truncate the detected country's number.
    const input = createInput(formatter.formatDisplay('12345'));
    input.setSelectionRange(2, 4);
    const event = createPasteEvent(input, text);

    expect(processPaste(event, { digits: '12345', formatter })).toEqual({
      country,
      newDigits,
      caretDigitIndex: newDigits.length
    });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('keeps existing insertion behavior when international detection fails', () => {
    const formatter = createFormatter();
    const input = createInput('1-2');
    input.setSelectionRange(1, 1);
    expect(processPaste(createPasteEvent(input, '+999'), { digits: '12', formatter })).toEqual({
      newDigits: '19992',
      caretDigitIndex: 4
    });
  });

  it('returns undefined when target is missing', () => {
    const formatter = createFormatter();
    const event = createPasteEvent(null, '99');

    expect(processPaste(event, { digits: '12', formatter })).toBeUndefined();
  });

  it('returns undefined when clipboardData is missing', () => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12'));
    input.setSelectionRange(1, 1);

    const event = createPasteEvent(input);

    const result = processPaste(event, { digits: '12', formatter });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it('inserts pasted digits at collapsed cursor on delimiters', () => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12'));
    // Value: `1-2`; cursor placed after the first digit '1' and before the separator
    input.setSelectionRange(1, 1);

    const event = createPasteEvent(input, '99');

    const result = processPaste(event, { digits: '12', formatter });
    expect(result?.newDigits).toBe('1992');
    expect(result?.caretDigitIndex).toBe(3);
  });

  it('falls back to insertion logic when selection range maps to no digits', () => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12'));
    input.setSelectionRange(1, 2); // only delimiter

    const event = createPasteEvent(input, '99');

    const result = processPaste(event, { digits: '12', formatter });
    expect(result?.newDigits).toBe('1992');
    expect(result?.caretDigitIndex).toBe(3);
  });

  it('inserts at index 0 when caret is at the beginning', () => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12'));
    input.setSelectionRange(0, 0);

    const event = createPasteEvent(input, '99');

    const result = processPaste(event, { digits: '12', formatter });
    expect(result?.newDigits).toBe('9912');
    expect(result?.caretDigitIndex).toBe(2);
  });

  it('replaces existing selection and clamps max digits', () => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12'));
    input.setSelectionRange(0, 3);

    const event = createPasteEvent(input, '9999');

    const result = processPaste(event, { digits: '12', formatter });
    expect(result?.newDigits).toBe('9999');
    expect(result?.caretDigitIndex).toBe(4);
  });

  it('returns undefined for paste values without digits', () => {
    const formatter = createFormatter();
    const input = createInput(formatter.formatDisplay('12'));
    input.setSelectionRange(1, 1);

    const event = createPasteEvent(input, 'abc()');

    const result = processPaste(event, { digits: '12', formatter });
    expect(result).toBeUndefined();
  });
});
