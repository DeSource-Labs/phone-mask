/// <reference types="vitest/globals" />
import { describe, expect, it, vi } from 'vitest';
import {
  extractDigits,
  getSelection,
  setCaret,
  processBeforeInput,
  processInput,
  processKeydown,
  processPaste
} from '../../src/handlers';
import { createPhoneFormatter } from '../../src/formatter';
import type { CountryKey } from '../../src/entries';

const createFormatter = () =>
  createPhoneFormatter({
    id: 'XX' as CountryKey,
    name: 'Testland',
    code: '+9',
    flag: '🏳️',
    mask: '#-##-##'
  });

describe('core handlers: digit helpers', () => {
  it('extracts and limits digits', () => {
    expect(extractDigits('+1 (234) 567-890', 5)).toBe('12345');
    expect(extractDigits('abc123')).toBe('123');
  });

  it('reads and sets input selection', () => {
    const input = document.createElement('input');
    input.value = '123-45';
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
    const event = {
      inputType: 'insertText',
      data: '1',
      target: null,
      preventDefault: vi.fn()
    } as unknown as InputEvent;

    processBeforeInput(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('blocks invalid chars and double spaces', () => {
    const input = document.createElement('input');
    input.value = '1 ';
    const event = {
      inputType: 'insertText',
      data: ' ',
      target: input,
      preventDefault: vi.fn()
    } as unknown as InputEvent;

    processBeforeInput(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('blocks invalid symbols', () => {
    const input = document.createElement('input');
    const event = {
      inputType: 'insertText',
      data: '@',
      target: input,
      preventDefault: vi.fn()
    } as unknown as InputEvent;

    processBeforeInput(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('allows a single space when the current value does not end with space', () => {
    const input = document.createElement('input');
    input.value = '1';
    const event = {
      inputType: 'insertText',
      data: ' ',
      target: input,
      preventDefault: vi.fn()
    } as unknown as InputEvent;

    processBeforeInput(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('ignores non-insert text input events', () => {
    const input = document.createElement('input');
    const event = {
      inputType: 'deleteContentBackward',
      data: '1',
      target: input,
      preventDefault: vi.fn()
    } as unknown as InputEvent;

    processBeforeInput(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});

describe('processInput', () => {
  it('extracts digits and clamps to max count', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = '1234-56';

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
    const event = {
      key: 'Backspace',
      target: null,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    expect(processKeydown(event, { digits: '12345', formatter })).toBeUndefined();
  });

  it('allows shortcut keys with modifiers', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12345');
    input.setSelectionRange(1, 1);

    const event = {
      key: 'a',
      target: input,
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(result).toBeUndefined();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('removes selected digits', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12345');
    input.setSelectionRange(0, 1); // Select the first digit '1'

    const event = {
      key: 'Backspace',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ newDigits: '2345', caretDigitIndex: 0 });
  });

  it('handles Backspace selection ranges that contain only delimiters', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12345');
    input.setSelectionRange(1, 2);

    const event = {
      key: 'Backspace',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(result).toEqual({ newDigits: '2345', caretDigitIndex: 0 });
  });

  it('deletes previous digit when caret on delimiter', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12345');
    // Position 1 is the separator in `1-23-45` format for this formatter
    input.setSelectionRange(1, 1);

    const event = {
      key: 'Backspace',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(result?.newDigits).toBe('2345');
  });

  it('skips delimiters when caret is after a delimiter on Backspace', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12345');
    // `1-23-45`: index 2 is just after delimiter '-'
    input.setSelectionRange(2, 2);

    const event = {
      key: 'Backspace',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(result?.newDigits).toBe('2345');
    expect(result?.caretDigitIndex).toBe(0);
  });

  it('deletes next digit for Delete when caret on delimiter', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12345');
    // Position 1 is the separator in `1-23-45`
    input.setSelectionRange(1, 1);

    const event = {
      key: 'Delete',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(result?.newDigits).toBe('1345');
  });

  it('blocks digits after max length', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12345');
    input.setSelectionRange(5, 5);

    const event = {
      key: '6',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it('returns undefined for Backspace at start with no selection', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12345');
    input.setSelectionRange(0, 0);

    const event = {
      key: 'Backspace',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it('returns undefined for Backspace when no previous digit can be resolved', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = '-';
    input.setSelectionRange(1, 1);

    const event = {
      key: 'Backspace',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(result).toBeUndefined();
  });

  it('returns undefined for Backspace when digit range cannot be mapped', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = 'x';
    input.setSelectionRange(1, 1);

    const event = {
      key: 'Backspace',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '', formatter });
    expect(result).toBeUndefined();
  });

  it('deletes selected digits for Delete key', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12345');
    input.setSelectionRange(0, 3);

    const event = {
      key: 'Delete',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(result).toEqual({ newDigits: '345', caretDigitIndex: 0 });
  });

  it('handles Delete selection ranges that contain only delimiters', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12345');
    input.setSelectionRange(1, 2);

    const event = {
      key: 'Delete',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(result).toEqual({ newDigits: '1345', caretDigitIndex: 1 });
  });

  it('returns undefined for Delete at the end', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12345');
    input.setSelectionRange(input.value.length, input.value.length);

    const event = {
      key: 'Delete',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '12345', formatter });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it('returns undefined for Delete when no next digit can be mapped', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = 'x';
    input.setSelectionRange(0, 0);

    const event = {
      key: 'Delete',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '', formatter });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it('blocks non-numeric single characters', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12');
    input.setSelectionRange(2, 2);

    const event = {
      key: 'a',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '12', formatter });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it('does not block multi-character non-navigation keys', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12');
    input.setSelectionRange(2, 2);

    const event = {
      key: 'F1',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '12', formatter });
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('allows numeric input when below max digits', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12');
    input.setSelectionRange(2, 2);

    const event = {
      key: '3',
      target: input,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      preventDefault: vi.fn()
    } as unknown as KeyboardEvent;

    const result = processKeydown(event, { digits: '12', formatter });
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});

describe('processPaste', () => {
  it('returns undefined when target is missing', () => {
    const formatter = createFormatter();
    const event = {
      target: null,
      clipboardData: { getData: () => '99' },
      preventDefault: vi.fn()
    } as unknown as ClipboardEvent;

    expect(processPaste(event, { digits: '12', formatter })).toBeUndefined();
  });

  it('returns undefined when clipboardData is missing', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12');
    input.setSelectionRange(1, 1);

    const event = {
      target: input,
      clipboardData: undefined,
      preventDefault: vi.fn()
    } as unknown as ClipboardEvent;

    const result = processPaste(event, { digits: '12', formatter });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it('inserts pasted digits at collapsed cursor on delimiters', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12');
    // Value: `1-2`; cursor placed after the first digit '1' and before the separator
    input.setSelectionRange(1, 1);

    const event = {
      target: input,
      clipboardData: {
        getData: () => '99'
      },
      preventDefault: vi.fn()
    } as unknown as ClipboardEvent;

    const result = processPaste(event, { digits: '12', formatter });
    expect(result?.newDigits).toBe('1992');
    expect(result?.caretDigitIndex).toBe(3);
  });

  it('falls back to insertion logic when selection range maps to no digits', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12');
    input.setSelectionRange(1, 2); // only delimiter

    const event = {
      target: input,
      clipboardData: {
        getData: () => '99'
      },
      preventDefault: vi.fn()
    } as unknown as ClipboardEvent;

    const result = processPaste(event, { digits: '12', formatter });
    expect(result?.newDigits).toBe('1992');
    expect(result?.caretDigitIndex).toBe(3);
  });

  it('inserts at index 0 when caret is at the beginning', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12');
    input.setSelectionRange(0, 0);

    const event = {
      target: input,
      clipboardData: {
        getData: () => '99'
      },
      preventDefault: vi.fn()
    } as unknown as ClipboardEvent;

    const result = processPaste(event, { digits: '12', formatter });
    expect(result?.newDigits).toBe('9912');
    expect(result?.caretDigitIndex).toBe(2);
  });

  it('replaces existing selection and clamps max digits', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12');
    input.setSelectionRange(0, 3);

    const event = {
      target: input,
      clipboardData: {
        getData: () => '9999'
      },
      preventDefault: vi.fn()
    } as unknown as ClipboardEvent;

    const result = processPaste(event, { digits: '12', formatter });
    expect(result?.newDigits).toBe('9999');
    expect(result?.caretDigitIndex).toBe(4);
  });

  it('returns undefined for paste values without digits', () => {
    const formatter = createFormatter();
    const input = document.createElement('input');
    input.value = formatter.formatDisplay('12');
    input.setSelectionRange(1, 1);

    const event = {
      target: input,
      clipboardData: {
        getData: () => 'abc()'
      },
      preventDefault: vi.fn()
    } as unknown as ClipboardEvent;

    const result = processPaste(event, { digits: '12', formatter });
    expect(result).toBeUndefined();
  });
});
