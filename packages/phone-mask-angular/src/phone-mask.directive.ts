import {
  DestroyRef,
  Directive,
  ElementRef,
  Inject,
  Optional,
  effect,
  forwardRef,
  input,
  model,
  output,
  signal,
  untracked
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { CountryKey, MaskFull } from '@desource/phone-mask';
import {
  createPhoneFormatter,
  detectByGeoIp,
  detectCountryFromLocale,
  extractDigits,
  getCountry,
  getNavigatorLang,
  parseCountryCode,
  processBeforeInput,
  processInput,
  processKeydown,
  processPaste,
  setCaret
} from '@desource/phone-mask/kit';
import { PHONE_MASK_CONFIG } from './config';
import { optionalBooleanAttribute } from './internal/boolean-input';
import { createPhoneNumber } from './internal/formatting';
import type { PhoneMaskConfig, PhoneMaskDirectiveInput, PhoneMaskDirectiveOptions, PhoneNumber } from './types';

function parseOptions(value: PhoneMaskDirectiveInput): PhoneMaskDirectiveOptions {
  if (typeof value === 'string') return { country: value };
  if (value && typeof value === 'object') return value;
  return {};
}

@Directive({
  selector: 'input[phoneMask]',
  standalone: true,
  exportAs: 'phoneMask',
  providers: [
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

  private readonly countryCode = signal('US');
  private readonly disabled = signal(false);
  private detectionKey = '';

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

  private readonly locale = () => this.options().locale || getNavigatorLang();
  private readonly country = () => getCountry(this.countryCode(), this.locale());
  private readonly formatter = () => createPhoneFormatter(this.country());
  private readonly digits = () => extractDigits(this.value(), this.formatter().getMaxDigits());
  private readonly phoneData = () => createPhoneNumber(this.digits(), this.country(), this.formatter());

  constructor(
    private readonly elementRef: ElementRef<HTMLInputElement>,
    private readonly destroyRef: DestroyRef,
    @Optional() @Inject(PHONE_MASK_CONFIG) private readonly config: PhoneMaskConfig = {}
  ) {
    const el = this.elementRef.nativeElement;

    this.countryCode.set(parseCountryCode(this.config.country, 'US'));

    el.setAttribute('type', 'tel');
    el.setAttribute('inputmode', 'tel');
    el.setAttribute('placeholder', '');

    const beforeInputHandler = (event: InputEvent) => this.handleBeforeInput(event);
    const inputHandler = (event: Event) => this.handleInput(event);
    const keydownHandler = (event: KeyboardEvent) => this.handleKeydown(event);
    const pasteHandler = (event: ClipboardEvent) => this.handlePaste(event);
    const blurHandler = () => this.onTouched();

    el.addEventListener('beforeinput', beforeInputHandler);
    el.addEventListener('input', inputHandler);
    el.addEventListener('keydown', keydownHandler);
    el.addEventListener('paste', pasteHandler);
    el.addEventListener('blur', blurHandler);

    this.destroyRef.onDestroy(() => {
      el.removeEventListener('beforeinput', beforeInputHandler);
      el.removeEventListener('input', inputHandler);
      el.removeEventListener('keydown', keydownHandler);
      el.removeEventListener('paste', pasteHandler);
      el.removeEventListener('blur', blurHandler);
    });

    effect(() => {
      const options = this.options();
      const parsed = parseCountryCode(options.country);

      if (parsed && parsed !== this.countryCode()) {
        queueMicrotask(() => this.setCountry(parsed));
      }
    });

    effect(() => {
      const options = this.options();

      if (!options.detect || options.country) return;

      const key = `${this.locale()}:${options.detect}`;
      if (this.detectionKey === key) return;

      this.detectionKey = key;
      void this.detectCountry();
    });

    effect(() => {
      const el = this.elementRef.nativeElement;
      const formatter = this.formatter();
      const digits = this.digits();

      el.value = formatter.formatDisplay(digits);
      el.placeholder = formatter.getPlaceholder();
    });

    effect(() => {
      const phone = this.phoneData();
      const options = this.options();

      this.phoneChange.emit(phone);
      options.onChange?.(phone);
    });

    effect(() => {
      const country = this.country();
      const options = this.options();

      this.countryChange.emit(country);
      options.onCountryChange?.(country);
    });
  }

  writeValue(value: string | number | null | undefined): void {
    this.setValue(extractDigits(String(value ?? ''), this.formatter().getMaxDigits()), false);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    this.elementRef.nativeElement.disabled = isDisabled;
  }

  clear(): void {
    this.setValue('', true);
  }

  selectCountry(country: CountryKey | string): boolean {
    return this.setCountry(country);
  }

  getDigits(): string {
    return this.digits();
  }

  getFullNumber(): string {
    return this.phoneData().full;
  }

  getFullFormattedNumber(): string {
    return this.phoneData().fullFormatted;
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

  private setCountry(country: CountryKey | string | null | undefined): boolean {
    const parsed = parseCountryCode(country);

    if (!parsed) return false;

    untracked(() => this.countryCode.set(parsed));

    const digits = this.digits();
    const maxDigits = this.formatter().getMaxDigits();

    if (digits.length > maxDigits) {
      this.setValue(digits.slice(0, maxDigits), true);
    }

    return true;
  }

  private async detectCountry(): Promise<void> {
    const geoCountry = parseCountryCode(await detectByGeoIp());

    if (geoCountry && this.setCountry(geoCountry)) return;

    this.setCountry(detectCountryFromLocale());
  }

  private scheduleCaretUpdate(el: HTMLInputElement | null, digitIndex: number): void {
    setTimeout(() => {
      const position = this.formatter().getCaretPosition(digitIndex);
      setCaret(el, position);
    });
  }

  private handleBeforeInput(event: InputEvent): void {
    processBeforeInput(event);
  }

  private handleInput(event: Event): void {
    if (this.disabled()) return;

    const result = processInput(event, { formatter: this.formatter() });
    if (!result) return;

    this.setValue(result.newDigits, true);
    this.scheduleCaretUpdate(event.target as HTMLInputElement | null, result.caretDigitIndex);
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    const result = processKeydown(event, { digits: this.digits(), formatter: this.formatter() });
    if (!result) return;

    this.setValue(result.newDigits, true);
    this.scheduleCaretUpdate(event.target as HTMLInputElement | null, result.caretDigitIndex);
  }

  private handlePaste(event: ClipboardEvent): void {
    if (this.disabled()) return;

    const result = processPaste(event, { digits: this.digits(), formatter: this.formatter() });
    if (!result) return;

    this.setValue(result.newDigits, true);
    this.scheduleCaretUpdate(event.target as HTMLInputElement | null, result.caretDigitIndex);
  }
}
