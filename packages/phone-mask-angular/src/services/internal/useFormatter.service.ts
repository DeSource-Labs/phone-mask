import { Injectable, Injector, computed, effect, inject } from '@angular/core';
import type { MaskFull } from '@desource/phone-mask';
import { createPhoneFormatter, extractDigits } from '@desource/phone-mask/kit';
import type { PhoneNumber } from '../../types';

interface UseFormatterOptions {
  country: () => MaskFull;
  value: () => string;
  onChange: (digits: string) => void;
  onPhoneChange?: (phone: PhoneNumber) => void;
  onValidationChange?: (isComplete: boolean) => void;
}

@Injectable()
export class UseFormatterService {
  private readonly injector = inject(Injector);
  private countryGetter: () => MaskFull = () => ({
    id: 'US',
    code: '+1',
    name: 'United States',
    flag: '🇺🇸',
    mask: ['###-###-####']
  });
  private valueGetter = () => '';
  private onChange: (digits: string) => void = () => {};
  private onPhoneChange: ((phone: PhoneNumber) => void) | undefined;
  private onValidationChange: ((isComplete: boolean) => void) | undefined;
  private configured = false;
  private clampedValueKey = '';

  readonly country = computed(() => this.countryGetter());
  readonly formatter = computed(() => createPhoneFormatter(this.country()));
  readonly digits = computed(() => extractDigits(this.valueGetter(), this.formatter().getMaxDigits()));
  readonly displayPlaceholder = computed(() => this.formatter().getPlaceholder());
  readonly displayValue = computed(() => this.formatter().formatDisplay(this.digits()));
  readonly phoneData = computed<PhoneNumber>(() => ({
    full: this.digits() ? `${this.country().code}${this.digits()}` : '',
    fullFormatted: this.displayValue() ? `${this.country().code} ${this.displayValue()}` : '',
    digits: this.digits()
  }));
  readonly full = computed(() => this.phoneData().full);
  readonly fullFormatted = computed(() => this.phoneData().fullFormatted);
  readonly isComplete = computed(() => this.formatter().isComplete(this.digits()));
  readonly isEmpty = computed(() => this.digits().length === 0);
  readonly shouldShowWarn = computed(() => !this.isEmpty() && !this.isComplete());

  configure(options: UseFormatterOptions): void {
    if (this.configured) return;
    this.configured = true;

    this.countryGetter = options.country;
    this.valueGetter = options.value;
    this.onChange = options.onChange;
    this.onPhoneChange = options.onPhoneChange;
    this.onValidationChange = options.onValidationChange;

    this.emitClampedValue();

    effect(
      () => {
        const value = this.valueGetter();
        const digits = this.digits();

        if (value === digits) {
          this.clampedValueKey = '';
        } else {
          queueMicrotask(() => this.emitClampedValue());
        }
      },
      { injector: this.injector }
    );

    effect(
      () => {
        this.onPhoneChange?.(this.phoneData());
      },
      { injector: this.injector }
    );

    effect(
      () => {
        this.onValidationChange?.(this.isComplete());
      },
      { injector: this.injector }
    );
  }

  private emitClampedValue(): void {
    const value = this.valueGetter();
    const digits = this.digits();

    if (value === digits) {
      this.clampedValueKey = '';
      return;
    }

    const key = `${value}\u0000${digits}`;
    if (key === this.clampedValueKey) return;

    this.clampedValueKey = key;
    this.onChange(digits);
  }
}
