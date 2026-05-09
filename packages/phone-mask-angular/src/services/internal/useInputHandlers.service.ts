import { Injectable } from '@angular/core';
import {
  processBeforeInput,
  processInput,
  processKeydown,
  processPaste,
  setCaret,
  type FormatterHelpers
} from '@desource/phone-mask/kit';

interface UseInputHandlersOptions {
  formatter: () => FormatterHelpers;
  digits: () => string;
  inactive?: () => boolean;
  onChange?: (digits: string) => void;
  scheduleValidationHint?: (delay: number) => void;
}

const HINT_DELAY_INPUT = 500;
const HINT_DELAY_ACTION = 300;

@Injectable()
export class UseInputHandlersService {
  private formatterGetter!: () => FormatterHelpers;
  private digitsGetter = () => '';
  private inactiveGetter = () => false;
  private onChange: ((digits: string) => void) | undefined;
  private scheduleValidationHint: ((delay: number) => void) | undefined;

  configure(options: UseInputHandlersOptions): void {
    this.formatterGetter = options.formatter;
    this.digitsGetter = options.digits;
    this.inactiveGetter = options.inactive ?? this.inactiveGetter;
    this.onChange = options.onChange;
    this.scheduleValidationHint = options.scheduleValidationHint;
  }

  handleBeforeInput(event: Event): void {
    if (this.inactiveGetter()) {
      event.preventDefault();
      return;
    }

    processBeforeInput(event as InputEvent);
  }

  handleInput(event: Event): void {
    if (this.inactiveGetter()) return;

    const result = processInput(event, { formatter: this.formatterGetter() });
    if (!result) return;

    this.onChange?.(result.newDigits);
    this.scheduleCaretUpdate(event.target as HTMLInputElement | null, result.caretDigitIndex);
    this.scheduleValidationHint?.(HINT_DELAY_INPUT);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.inactiveGetter()) {
      event.preventDefault();
      return;
    }

    const result = processKeydown(event, { digits: this.digitsGetter(), formatter: this.formatterGetter() });
    if (!result) return;

    this.onChange?.(result.newDigits);
    this.scheduleCaretUpdate(event.target as HTMLInputElement | null, result.caretDigitIndex);
    this.scheduleValidationHint?.(HINT_DELAY_ACTION);
  }

  handlePaste(event: ClipboardEvent): void {
    if (this.inactiveGetter()) {
      event.preventDefault();
      return;
    }

    const result = processPaste(event, { digits: this.digitsGetter(), formatter: this.formatterGetter() });
    if (!result) return;

    this.onChange?.(result.newDigits);
    this.scheduleCaretUpdate(event.target as HTMLInputElement | null, result.caretDigitIndex);
    this.scheduleValidationHint?.(HINT_DELAY_ACTION);
  }

  private scheduleCaretUpdate(el: HTMLInputElement | null, digitIndex: number): void {
    setTimeout(() => {
      const position = this.formatterGetter().getCaretPosition(digitIndex);
      setCaret(el, position);
    });
  }
}
