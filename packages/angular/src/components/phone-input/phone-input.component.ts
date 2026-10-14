import { NgTemplateOutlet, DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  TemplateRef,
  viewChild
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { CountryKey, MaskFull } from '@desource/phone-mask';
import { extractDigits } from '@desource/phone-mask/kit';
import { useCountry } from '../../services/internal/useCountry.service';
import { useFormatter } from '../../services/internal/useFormatter.service';
import { useInputHandlers } from '../../services/internal/useInputHandlers.service';
import { useCountrySelector } from '../../services/internal/useCountrySelector.service';
import { useCopyAction } from '../../services/internal/useCopyAction.service';
import { useTheme } from '../../services/internal/useTheme.service';
import { useValidationHint } from '../../services/internal/useValidationHint.service';
import type { PhoneInputExposed, PhoneNumber, Size, Theme } from '../../types';

let nextDropdownId = 0;

@Component({
  selector: 'phone-input',
  imports: [NgTemplateOutlet],
  templateUrl: './phone-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.id]': 'null' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true }]
})
export class PhoneInputComponent implements ControlValueAccessor, PhoneInputExposed {
  readonly value = input('');
  readonly valueChange = output<string>();
  readonly id = input<string>();
  readonly name = input<string>();
  readonly country = input<CountryKey>();
  readonly locale = input<string>();
  readonly detect = input(true, { transform: booleanAttribute });
  readonly size = input<Size>('normal');
  readonly theme = input<Theme>('auto');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { alias: 'readonly', transform: booleanAttribute });
  readonly showCopy = input(true, { transform: booleanAttribute });
  readonly showClear = input(false, { transform: booleanAttribute });
  readonly withValidity = input(true, { transform: booleanAttribute });
  readonly disableDefaultStyles = input(false, { transform: booleanAttribute });
  readonly searchPlaceholder = input('Search country or code...');
  readonly noResultsText = input('No countries found');
  readonly clearButtonLabel = input('Clear phone number');
  readonly dropdownClass = input('');
  readonly flagTemplate = input<TemplateRef<{ $implicit: MaskFull; country: MaskFull }>>();
  readonly copyTemplate = input<TemplateRef<{ $implicit: boolean; copied: boolean }>>();
  readonly clearTemplate = input<TemplateRef<unknown>>();
  readonly actionsTemplate = input<TemplateRef<unknown>>();
  readonly phoneChange = output<PhoneNumber>();
  readonly countryChange = output<MaskFull>();
  readonly validationChange = output<boolean>();
  readonly phoneFocus = output<FocusEvent>();
  readonly phoneBlur = output<FocusEvent>();
  readonly touchedChange = output<boolean>();
  readonly copied = output<string>();
  readonly cleared = output<void>();

  private readonly sourceValue = linkedSignal(() => ({ value: this.value() }));
  private readonly internalValue = linkedSignal<{ value: string }, string>({
    source: this.sourceValue,
    computation: (source, previous) =>
      extractDigits(source === previous?.source ? previous.value : source.value, this.mask.formatter().getMaxDigits())
  });
  private readonly formDisabled = signal(false);
  private formOnChange?: (value: string) => void;
  private formOnTouched?: () => void;
  private readonly document = inject(DOCUMENT);
  protected readonly mounted = signal(false);
  protected dropdownId = '';
  protected listboxId = '';
  protected readonly rootRef = viewChild<ElementRef<HTMLDivElement>>('root');
  protected readonly telRef = viewChild<ElementRef<HTMLInputElement>>('tel');
  protected readonly liveRef = viewChild<ElementRef<HTMLDivElement>>('live');
  protected readonly dropdownRef = viewChild<ElementRef<HTMLDivElement>>('dropdown');
  protected readonly searchRef = viewChild<ElementRef<HTMLInputElement>>('search');
  protected readonly selectorRef = viewChild<ElementRef<HTMLButtonElement>>('selectorButton');
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly inactive = computed(() => this.isDisabled() || this.readOnly());
  protected readonly countryState = useCountry({
    country: this.country,
    locale: this.locale,
    detect: this.detect,
    onCountryChange: (country) => this.countryChange.emit(country)
  });
  protected readonly mask = useFormatter({
    country: this.countryState.country,
    value: this.internalValue,
    onPhoneChange: (phone) => this.phoneChange.emit(phone),
    onValidationChange: (complete) => this.validationChange.emit(complete)
  });
  protected readonly hint = useValidationHint();
  protected readonly incomplete = computed(() => this.hint.showValidationHint() && this.mask.shouldShowWarn());
  protected readonly showCopyButton = computed(() => this.showCopy() && !this.mask.isEmpty() && !this.isDisabled());
  protected readonly showClearButton = computed(() => this.showClear() && !this.mask.isEmpty() && !this.inactive());
  protected readonly copy = useCopyAction({
    fullFormatted: this.mask.fullFormatted,
    liveRef: () => this.liveRef()?.nativeElement ?? null,
    onCopy: (value) => this.copied.emit(value)
  });
  protected readonly selector = useCountrySelector({
    rootRef: () => this.rootRef()?.nativeElement ?? null,
    dropdownRef: () => this.dropdownRef()?.nativeElement ?? null,
    searchRef: () => this.searchRef()?.nativeElement ?? null,
    selectorRef: () => this.selectorRef()?.nativeElement ?? null,
    locale: this.countryState.locale,
    countryOption: this.country,
    inactive: this.inactive,
    onSelectCountry: (code) => {
      const previous = this.internalValue();
      if (!this.countryState.setCountry(code)) return;
      const digits = this.internalValue();
      if (digits !== previous) this.changeValue(digits);
    },
    onAfterSelect: () => this.focus()
  });
  protected readonly canOpenDropdown = computed(() => this.selector.hasDropdown() && !this.inactive());
  protected readonly activeOptionId = computed(() =>
    this.selector.dropdownOpen() && this.selector.filteredCountries()[this.selector.focusedIndex()]
      ? this.optionId(this.selector.focusedIndex())
      : null
  );
  protected readonly handlers = useInputHandlers({
    formatter: this.mask.formatter,
    digits: this.mask.digits,
    inactive: this.inactive,
    onChange: (digits) => this.changeValue(digits),
    scheduleValidationHint: this.hint.scheduleValidationHint
  });
  protected readonly resolvedTheme = useTheme({ theme: this.theme });

  constructor() {
    afterNextRender(() => {
      const id = nextDropdownId++;
      this.dropdownId = `pi-dropdown-${id}`;
      this.listboxId = `pi-options-${id}`;
      this.mounted.set(true);
    });
    afterRenderEffect({
      write: () => {
        const dropdown = this.dropdownRef()?.nativeElement;
        if (dropdown && dropdown.parentElement !== this.document.body) this.document.body.appendChild(dropdown);
      }
    });
    inject(DestroyRef).onDestroy(() => this.dropdownRef()?.nativeElement.remove());
  }

  protected optionId(index: number): string {
    return `${this.listboxId}-${index}`;
  }
  protected changeValue(value: string): void {
    this.internalValue.set(value);
    this.valueChange.emit(value);
    this.formOnChange?.(value);
  }
  protected handleFocus(event: FocusEvent): void {
    this.hint.clearValidationHint(false);
    this.selector.closeDropdown();
    this.phoneFocus.emit(event);
  }
  protected handleBlur(event: FocusEvent): void {
    this.formOnTouched?.();
    this.touchedChange.emit(true);
    this.phoneBlur.emit(event);
  }
  protected clearAndFocus(): void {
    this.clear();
    this.focus();
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
  focus(): void {
    this.telRef()?.nativeElement.focus({ preventScroll: true });
  }
  blur(): void {
    this.telRef()?.nativeElement.blur();
  }
  clear(): void {
    this.changeValue('');
    this.hint.clearValidationHint();
    this.cleared.emit();
  }
  selectCountry(country: CountryKey): void {
    this.selector.selectCountry(country);
  }
  getFullNumber(): string {
    return this.mask.full();
  }
  getFullFormattedNumber(): string {
    return this.mask.fullFormatted();
  }
  getDigits(): string {
    return this.mask.digits();
  }
  isValid(): boolean {
    return this.mask.isComplete();
  }
  isComplete(): boolean {
    return this.mask.isComplete();
  }
}
