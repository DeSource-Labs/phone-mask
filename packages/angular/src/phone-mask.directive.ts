import {
  booleanAttribute,
  computed,
  Directive,
  ElementRef,
  forwardRef,
  inject,
  input,
  linkedSignal,
  output,
  signal
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { extractDigits } from '@desource/phone-mask/kit';
import { useCountry } from './services/internal/useCountry.service';
import { useFormatter } from './services/internal/useFormatter.service';
import { useInputHandlers } from './services/internal/useInputHandlers.service';
import type { PhoneMaskDirectiveOptions, PhoneNumber } from './types';

/** Adds masking to a native input, including Angular forms and server-rendered values. */
@Directive({
  selector: 'input[phoneMask]',
  exportAs: 'phoneMask',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneMaskDirective), multi: true }],
  host: {
    type: 'tel',
    inputmode: 'tel',
    '[value]': 'mask.displayValue()',
    '[placeholder]': 'mask.displayPlaceholder()',
    '[disabled]': 'isDisabled()',
    '(beforeinput)': 'handlers.handleBeforeInput($event)',
    '(input)': 'handlers.handleInput($event)',
    '(keydown)': 'handlers.handleKeydown($event)',
    '(paste)': 'handlers.handlePaste($event)',
    '(blur)': 'handleBlur()'
  }
})
export class PhoneMaskDirective implements ControlValueAccessor {
  readonly phoneMask = input<PhoneMaskDirectiveOptions | string>({});
  readonly value = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly valueChange = output<string>();
  readonly phoneChange = output<PhoneNumber>();
  protected readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly sourceValue = linkedSignal(() => ({ value: this.value() }));
  private readonly internalValue = linkedSignal<{ value: string }, string>({
    source: this.sourceValue,
    computation: (source, previous) =>
      extractDigits(source === previous?.source ? previous.value : source.value, this.mask.formatter().getMaxDigits())
  });
  private readonly options = computed(() => {
    const value = this.phoneMask();
    return typeof value === 'string' ? { country: value } : value;
  });
  private formOnChange?: (value: string) => void;
  private formOnTouched?: () => void;
  readonly country = useCountry({
    country: () => this.options().country,
    locale: () => this.options().locale,
    detect: () => this.options().detect,
    onCountryChange: (country) => this.options().onCountryChange?.(country)
  });
  readonly mask = useFormatter({
    country: this.country.country,
    value: this.internalValue,
    onPhoneChange: (phone) => {
      this.phoneChange.emit(phone);
      this.options().onChange?.(phone);
    }
  });
  protected readonly handlers = useInputHandlers({
    formatter: this.mask.formatter,
    digits: this.mask.digits,
    inactive: () => this.element.nativeElement.disabled || this.element.nativeElement.readOnly,
    onEdit: this.country.onEdit,
    onChange: (digits) => {
      this.internalValue.set(digits);
      this.valueChange.emit(digits);
      this.formOnChange?.(digits);
    }
  });
  protected handleBlur(): void {
    this.formOnTouched?.();
  }
  writeValue(value: string | null | undefined): void {
    this.sourceValue.set({ value: value ?? '' });
  }
  registerOnChange(callback: (value: string) => void): void {
    this.formOnChange = callback;
  }
  registerOnTouched(callback: () => void): void {
    this.formOnTouched = callback;
  }
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
