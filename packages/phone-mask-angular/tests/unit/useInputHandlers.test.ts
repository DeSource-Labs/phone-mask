/// <reference types="vitest/globals" />
import { createPhoneFormatter, getCountry } from '@desource/phone-mask/kit';
import { testUseInputHandlers, type SetupOptions } from '@common/tests/unit/useInputHandlers';
import { UseInputHandlersService } from '@src/services/internal/useInputHandlers.service';
import { tools } from './setup/tools';

function setup(options: SetupOptions = {}) {
  let digits = options.digits ?? '';
  let inactive = options.inactive ?? false;

  const onChange = vi.fn();
  const scheduleValidationHint = vi.fn();
  const formatter = createPhoneFormatter(getCountry('US', 'en'));
  const service = new UseInputHandlersService();
  const inputEl = document.createElement('input');

  document.body.appendChild(inputEl);

  service.configure({
    formatter: () => formatter,
    digits: () => digits,
    inactive: () => inactive,
    onChange,
    scheduleValidationHint
  });

  const beforeInputHandler = (event: InputEvent) => service.handleBeforeInput(event);
  const inputHandler = (event: Event) => service.handleInput(event);
  const keydownHandler = (event: KeyboardEvent) => service.handleKeydown(event);
  const pasteHandler = (event: ClipboardEvent) => service.handlePaste(event);

  inputEl.addEventListener('beforeinput', beforeInputHandler);
  inputEl.addEventListener('input', inputHandler);
  inputEl.addEventListener('keydown', keydownHandler);
  inputEl.addEventListener('paste', pasteHandler);

  return {
    unmount: () => {
      inputEl.removeEventListener('beforeinput', beforeInputHandler);
      inputEl.removeEventListener('input', inputHandler);
      inputEl.removeEventListener('keydown', keydownHandler);
      inputEl.removeEventListener('paste', pasteHandler);
      inputEl.remove();
    },
    rerender: (newProps: SetupOptions) => {
      if (newProps.digits !== undefined) digits = newProps.digits;
      if (newProps.inactive !== undefined) inactive = newProps.inactive;
    },
    onChange,
    scheduleValidationHint,
    inputEl,
    invokeInputWithoutTarget: () => {
      service.handleInput({ target: null } as unknown as Event);
    }
  };
}

testUseInputHandlers(setup, tools);

describe('UseInputHandlersService Angular edges', () => {
  it('prevents beforeinput when inactive', async () => {
    const { inputEl, unmount } = setup({ inactive: true });
    const event = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: '5'
    });
    const preventDefault = vi.spyOn(event, 'preventDefault');

    await tools.act(async () => {
      inputEl.dispatchEvent(event);
    });

    expect(preventDefault).toHaveBeenCalledOnce();
    unmount();
  });

  it('handles valid input without optional callbacks', async () => {
    const formatter = createPhoneFormatter(getCountry('US', 'en'));
    const service = new UseInputHandlersService();
    const inputEl = document.createElement('input');

    service.configure({
      formatter: () => formatter,
      digits: () => ''
    });

    await tools.act(async () => {
      inputEl.value = '202-555-0199';
      service.handleInput({ target: inputEl } as unknown as Event);
    });

    expect(inputEl.value).toBe('202-555-0199');
  });
});
