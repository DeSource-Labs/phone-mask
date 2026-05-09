import {
  Directive,
  DestroyRef,
  ElementRef,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  untracked
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { CountryKey, MaskFull } from '@desource/phone-mask';
import { extractDigits } from '@desource/phone-mask/kit';
import { PHONE_MASK_CONFIG } from './config';
import { optionalBooleanAttribute } from './internal/boolean-input';
import { UseCountryService } from './services/internal/useCountry.service';
import { UseFormatterService } from './services/internal/useFormatter.service';
import { UseInputHandlersService } from './services/internal/useInputHandlers.service';
import type {
  DirectiveHTMLInputElement,
  PhoneMaskConfig,
  PhoneMaskDirectiveInput,
  PhoneMaskDirectiveOptions,
  PhoneNumber
} from './types';

function parseOptions(value: PhoneMaskDirectiveInput): PhoneMaskDirectiveOptions {
  if (typeof value === 'string') return { country: value };
  if (value && typeof value === 'object') return value;
  return {};
}

@Directive({
  selector: '[phoneMask]',
  standalone: true,
  exportAs: 'phoneMask',
  providers: [
    UseCountryService,
    UseFormatterService,
    UseInputHandlersService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneMaskDirective),
      multi: true
    }
  ]
})
export class PhoneMaskDirective implements ControlValueAccessor {
  readonly phoneMask = input<PhoneMaskDirectiveInput>(undefined);
  readonly countryInput = input<CountryKey | string | undefined>(undefined, { alias: 'phoneMaskCountry' });
  readonly localeInput = input<string | undefined>(undefined, { alias: 'phoneMaskLocale' });
  readonly detectInput = input<boolean | undefined, unknown>(undefined, {
    alias: 'phoneMaskDetect',
    transform: optionalBooleanAttribute
  });
  readonly value = model<string>('', { alias: 'phoneMaskValue' });

  readonly phoneChange = output<PhoneNumber>({ alias: 'phoneMaskChange' });
  readonly countryChange = output<MaskFull>({ alias: 'phoneMaskCountryChange' });

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly countryState = inject(UseCountryService);
  private readonly formatterState = inject(UseFormatterService);
  private readonly inputHandlers = inject(UseInputHandlersService);
  private readonly config: PhoneMaskConfig = inject(PHONE_MASK_CONFIG, { optional: true }) ?? {};

  private readonly inputElement = this.elementRef.nativeElement as DirectiveHTMLInputElement;
  private readonly isInput = this.inputElement.tagName === 'INPUT';
  private onTouched: () => void = () => {};
  private onChange: (value: string) => void = () => {};

  private readonly options = () => {
    const parsed = parseOptions(this.phoneMask());

    return {
      ...parsed,
      country: this.countryInput() ?? parsed.country ?? this.config.country,
      locale: this.localeInput() ?? parsed.locale ?? this.config.locale,
      detect: this.detectInput() ?? parsed.detect ?? this.config.detect ?? false
    };
  };

  readonly locale = this.countryState.locale;
  readonly country = this.countryState.country;
  readonly formatter = this.formatterState.formatter;
  readonly digits = this.formatterState.digits;
  readonly full = this.formatterState.full;
  readonly fullFormatted = this.formatterState.fullFormatted;

  constructor() {
    if (!this.isInput) {
      console.warn('[phoneMask] Directive can only be used on input elements');
      return;
    }

    this.inputElement.setAttribute('type', 'tel');
    this.inputElement.setAttribute('inputmode', 'tel');
    this.inputElement.setAttribute('placeholder', '');

    this.countryState.configure({
      country: () => this.options().country,
      locale: () => this.options().locale,
      detect: () => this.options().detect,
      onCountryChange: (country) => {
        this.countryChange.emit(country);
        this.options().onCountryChange?.(country);
      }
    });

    this.formatterState.configure({
      country: this.country,
      value: this.value,
      onChange: (digits) => this.setValue(digits, true),
      onPhoneChange: (phone) => {
        this.phoneChange.emit(phone);
        this.options().onChange?.(phone);
      }
    });

    this.inputHandlers.configure({
      formatter: this.formatter,
      digits: this.digits,
      onChange: (digits) => this.setValue(digits, true)
    });

    const beforeInputHandler = (event: Event) => this.inputHandlers.handleBeforeInput(event);
    const inputHandler = (event: Event) => this.inputHandlers.handleInput(event);
    const keydownHandler = (event: KeyboardEvent) => this.inputHandlers.handleKeydown(event);
    const pasteHandler = (event: ClipboardEvent) => this.inputHandlers.handlePaste(event);
    const blurHandler = () => this.onTouched();

    this.inputElement.addEventListener('beforeinput', beforeInputHandler);
    this.inputElement.addEventListener('input', inputHandler);
    this.inputElement.addEventListener('keydown', keydownHandler);
    this.inputElement.addEventListener('paste', pasteHandler);
    this.inputElement.addEventListener('blur', blurHandler);

    this.destroyRef.onDestroy(() => {
      this.inputElement.removeEventListener('beforeinput', beforeInputHandler);
      this.inputElement.removeEventListener('input', inputHandler);
      this.inputElement.removeEventListener('keydown', keydownHandler);
      this.inputElement.removeEventListener('paste', pasteHandler);
      this.inputElement.removeEventListener('blur', blurHandler);
      delete this.inputElement.__phoneMaskState;
    });

    effect(() => {
      this.inputElement.value = this.formatterState.displayValue();
      this.inputElement.placeholder = this.formatterState.displayPlaceholder();

      let state = this.inputElement.__phoneMaskState;

      if (!state) {
        state = {
          country: this.country(),
          formatter: this.formatter(),
          digits: this.digits(),
          locale: this.locale(),
          options: this.options(),
          setCountry: (code) => {
            const updated = this.selectCountry(code);
            if (!updated || !this.inputElement.__phoneMaskState) return false;

            this.inputElement.__phoneMaskState.country = this.country();
            this.inputElement.__phoneMaskState.formatter = this.formatter();
            this.inputElement.__phoneMaskState.digits = this.digits();
            this.inputElement.__phoneMaskState.locale = this.locale();
            this.inputElement.__phoneMaskState.options = this.options();
            return true;
          }
        };
      }

      state.country = this.country();
      state.formatter = this.formatter();
      state.digits = this.digits();
      state.locale = this.locale();
      state.options = this.options();
      this.inputElement.__phoneMaskState = state;
    });
  }

  writeValue(value: string | number | null | undefined): void {
    if (!this.isInput) return;
    this.setValue(String(value ?? ''), false);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (!this.isInput) return;
    this.inputElement.disabled = isDisabled;
  }

  clear(): void {
    this.setValue('', true);
  }

  selectCountry(country: CountryKey | string): boolean {
    const updated = this.countryState.setCountry(country);

    if (!updated) return false;

    const maxDigits = this.formatter().getMaxDigits();
    if (this.digits().length > maxDigits) {
      this.setValue(this.digits().slice(0, maxDigits), true);
    }

    return true;
  }

  getDigits(): string {
    return this.digits();
  }

  getFullNumber(): string {
    return this.full();
  }

  getFullFormattedNumber(): string {
    return this.fullFormatted();
  }

  isComplete(): boolean {
    return this.formatter().isComplete(this.digits());
  }

  isValid(): boolean {
    return this.isComplete();
  }

  private setValue(value: string, emit: boolean): void {
    const nextDigits = extractDigits(value, this.formatter().getMaxDigits());

    untracked(() => this.value.set(nextDigits));

    if (emit) {
      this.onChange(nextDigits);
    }
  }
}
