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

  const beforeInputHandler = (event: Event) => service.handleBeforeInput(event);
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
