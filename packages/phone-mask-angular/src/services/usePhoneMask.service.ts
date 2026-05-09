import { DestroyRef, Injectable, Injector, computed, effect, inject, signal, untracked } from '@angular/core';
import type { CountryKey, MaskFull } from '@desource/phone-mask';
import type { FormatterHelpers } from '@desource/phone-mask/kit';
import { UseCountryService } from './internal/useCountry.service';
import { UseFormatterService } from './internal/useFormatter.service';
import { UseInputHandlersService } from './internal/useInputHandlers.service';
import type { PhoneNumber } from '../types';

export interface UsePhoneMaskOptions {
  /** Controlled value: digits only, without country code. */
  value: () => string;
  /** Called when digits change. */
  onChange: (digits: string) => void;
  /** Country ISO 3166-1 alpha-2 code. */
  country?: () => CountryKey | string | undefined;
  /** Locale for country names. */
  locale?: () => string | undefined;
  /** Auto-detect country via GeoIP/locale. */
  detect?: () => boolean | undefined;
  /** Called on every phone number update. */
  onPhoneChange?: (phone: PhoneNumber) => void;
  /** Called when country changes. */
  onCountryChange?: (country: MaskFull) => void;
}

@Injectable()
export class UsePhoneMaskService {
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stateInjector = Injector.create({
    providers: [UseCountryService, UseFormatterService, UseInputHandlersService],
    parent: this.injector,
    name: 'UsePhoneMaskService'
  });
  private readonly countryState = this.stateInjector.get(UseCountryService);
  private readonly formatterState = this.stateInjector.get(UseFormatterService);
  private readonly inputHandlers = this.stateInjector.get(UseInputHandlersService);
  private readonly inputElement = signal<HTMLInputElement | null>(null);
  private onChange: (digits: string) => void = () => {};
  private configured = false;

  readonly country = this.countryState.country;
  readonly locale = this.countryState.locale;
  readonly digits = this.formatterState.digits;
  readonly formatter = this.formatterState.formatter;
  readonly full = this.formatterState.full;
  readonly fullFormatted = this.formatterState.fullFormatted;
  readonly isComplete = this.formatterState.isComplete;
  readonly isEmpty = this.formatterState.isEmpty;
  readonly shouldShowWarn = this.formatterState.shouldShowWarn;
  readonly inputRef = computed(() => this.inputElement());

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.connect(null);
      this.stateInjector.destroy();
    });
  }

  configure(options: UsePhoneMaskOptions): void {
    if (this.configured) return;
    this.configured = true;
    this.onChange = options.onChange;

    this.countryState.configure({
      country: options.country,
      locale: options.locale,
      detect: options.detect,
      onCountryChange: options.onCountryChange
    });

    this.formatterState.configure({
      country: this.country,
      value: options.value,
      onChange: options.onChange,
      onPhoneChange: options.onPhoneChange
    });

    this.inputHandlers.configure({
      formatter: this.formatter,
      digits: this.digits,
      onChange: options.onChange
    });

    effect(
      () => {
        const el = this.inputElement();
        if (!el) return;

        this.syncInputElement(el);
      },
      { injector: this.injector }
    );

    effect(
      (onCleanup) => {
        const el = this.inputElement();
        if (!el) return;

        const beforeInputHandler = (event: Event) => this.inputHandlers.handleBeforeInput(event);
        const inputHandler = (event: Event) => this.inputHandlers.handleInput(event);
        const keydownHandler = (event: KeyboardEvent) => this.inputHandlers.handleKeydown(event);
        const pasteHandler = (event: ClipboardEvent) => this.inputHandlers.handlePaste(event);

        el.addEventListener('beforeinput', beforeInputHandler);
        el.addEventListener('input', inputHandler);
        el.addEventListener('keydown', keydownHandler);
        el.addEventListener('paste', pasteHandler);

        onCleanup(() => {
          el.removeEventListener('beforeinput', beforeInputHandler);
          el.removeEventListener('input', inputHandler);
          el.removeEventListener('keydown', keydownHandler);
          el.removeEventListener('paste', pasteHandler);
        });
      },
      { injector: this.injector }
    );
  }

  connect(inputElement: HTMLInputElement | null): void {
    untracked(() => this.inputElement.set(inputElement));
  }

  setCountry(countryCode?: CountryKey | string | null): boolean {
    const updated = this.countryState.setCountry(countryCode);
    if (updated) this.syncInputElement();

    return updated;
  }

  clear(): void {
    const el = this.inputElement();
    if (el) el.value = '';
    this.onChange('');
  }

  getDigits(): string {
    return this.digits();
  }

  getFormatter(): FormatterHelpers {
    return this.formatter();
  }

  private syncInputElement(inputElement = this.inputElement()): void {
    if (!inputElement) return;

    inputElement.setAttribute('type', 'tel');
    inputElement.setAttribute('inputmode', 'tel');
    inputElement.value = this.formatterState.displayValue();
    inputElement.setAttribute('placeholder', this.formatterState.displayPlaceholder());
  }
}
