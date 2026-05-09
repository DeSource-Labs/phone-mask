import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { CountryKey, MaskFull } from '@desource/phone-mask';
import { extractDigits } from '@desource/phone-mask/kit';
import { UseCopyActionService } from '../../services/internal/useCopyAction.service';
import { UseCountryService } from '../../services/internal/useCountry.service';
import { UseCountrySelectorService } from '../../services/internal/useCountrySelector.service';
import { UseFormatterService } from '../../services/internal/useFormatter.service';
import { UseInputHandlersService } from '../../services/internal/useInputHandlers.service';
import { UseThemeService } from '../../services/internal/useTheme.service';
import { UseValidationHintService } from '../../services/internal/useValidationHint.service';
import { UseClipboardService } from '../../services/utility/useClipboard.service';
import type { PhoneInputRef, PhoneNumber, Size, Theme } from '../../types';

let nextDropdownId = 0;

@Component({
  selector: 'desource-phone-input',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './phone-input.component.html',
  styleUrl: './phone-input.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    UseClipboardService,
    UseCopyActionService,
    UseCountryService,
    UseCountrySelectorService,
    UseFormatterService,
    UseInputHandlersService,
    UseThemeService,
    UseValidationHintService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true
    }
  ]
})
export class PhoneInputComponent implements ControlValueAccessor, PhoneInputRef {
  readonly value = model<string>('');

  readonly id = input<string | undefined>();
  readonly name = input<string | undefined>();
  readonly countryInput = input<CountryKey | string | undefined>(undefined, { alias: 'country' });
  readonly detectInput = input(true, {
    alias: 'detect',
    transform: booleanAttribute
  });
  readonly localeInput = input<string | undefined>(undefined, { alias: 'locale' });
  readonly size = input<Size>('normal');
  readonly theme = input<Theme>('auto');
  readonly disabledInput = input(false, { alias: 'disabled', transform: booleanAttribute });
  readonly readOnlyInput = input(false, { alias: 'readonly', transform: booleanAttribute });
  readonly showCopy = input(true, { transform: booleanAttribute });
  readonly showClear = input(false, { transform: booleanAttribute });
  readonly withValidity = input(true, { transform: booleanAttribute });
  readonly searchPlaceholder = input('Search country or code...');
  readonly noResultsText = input('No countries found');
  readonly clearButtonLabel = input('Clear phone number');
  readonly dropdownClass = input('');
  readonly disableDefaultStyles = input(false, { transform: booleanAttribute });

  readonly phoneChange = output<PhoneNumber>();
  readonly countryChange = output<MaskFull>();
  readonly validationChange = output<boolean>();
  readonly focused = output<FocusEvent>({ alias: 'focus' });
  readonly blurred = output<FocusEvent>({ alias: 'blur' });
  readonly copiedValue = output<string>({ alias: 'copy' });
  readonly cleared = output<void>({ alias: 'clear' });

  readonly actionsBeforeTemplate = contentChild<TemplateRef<unknown>>('actionsBefore');
  readonly flagTemplate = contentChild<TemplateRef<{ $implicit: MaskFull; country: MaskFull }>>('flag');
  readonly copySvgTemplate = contentChild<TemplateRef<{ copied: boolean }>>('copySvg');
  readonly clearSvgTemplate = contentChild<TemplateRef<unknown>>('clearSvg');

  private readonly rootRef = viewChild<ElementRef<HTMLDivElement>>('root');
  private readonly telRef = viewChild<ElementRef<HTMLInputElement>>('telInput');
  private readonly liveRef = viewChild<ElementRef<HTMLDivElement>>('live');
  private readonly dropdownRef = viewChild<ElementRef<HTMLDivElement>>('dropdown');
  private readonly searchRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly selectorRef = viewChild<ElementRef<HTMLButtonElement>>('selectorButton');

  private readonly countryState = inject(UseCountryService);
  private readonly formatterState = inject(UseFormatterService);
  private readonly inputHandlers = inject(UseInputHandlersService);
  private readonly validationHint = inject(UseValidationHintService);
  private readonly countrySelector = inject(UseCountrySelectorService);
  private readonly copyAction = inject(UseCopyActionService);
  private readonly themeState = inject(UseThemeService);

  private readonly formDisabled = signal(false);
  private onTouched: () => void = () => {};
  private onChange: (value: string) => void = () => {};

  readonly locale = this.countryState.locale;
  readonly country = this.countryState.country;
  readonly formatter = this.formatterState.formatter;
  readonly digits = this.formatterState.digits;
  readonly displayPlaceholder = this.formatterState.displayPlaceholder;
  readonly displayValue = this.formatterState.displayValue;
  readonly phoneData = this.formatterState.phoneData;
  readonly full = this.formatterState.full;
  readonly fullFormatted = this.formatterState.fullFormatted;
  readonly isCompleteSignal = this.formatterState.isComplete;
  readonly isEmpty = this.formatterState.isEmpty;
  readonly shouldShowWarn = this.formatterState.shouldShowWarn;
  readonly showValidationHint = this.validationHint.showValidationHint;
  readonly dropdownOpen = this.countrySelector.dropdownOpen;
  readonly search = this.countrySelector.search;
  readonly focusedIndex = this.countrySelector.focusedIndex;
  readonly filteredCountries = this.countrySelector.filteredCountries;
  readonly hasDropdown = this.countrySelector.hasDropdown;
  readonly themeClass = this.themeState.themeClass;
  readonly copied = this.copyAction.copied;
  readonly copyAriaLabel = this.copyAction.copyAriaLabel;
  readonly copyButtonTitle = this.copyAction.copyButtonTitle;

  readonly dropdownId = ++nextDropdownId;
  readonly dropdownElementId = `pi-dropdown-${this.dropdownId}`;
  readonly listboxId = `pi-options-${this.dropdownId}`;

  readonly isDisabled = computed(() => this.disabledInput() || this.formDisabled());
  readonly isReadOnly = computed(() => this.readOnlyInput());
  readonly inactive = computed(() => this.isDisabled() || this.isReadOnly());
  readonly incomplete = computed(() => this.showValidationHint() && this.shouldShowWarn());
  readonly showCopyButton = computed(() => this.showCopy() && !this.isEmpty() && !this.isDisabled());
  readonly showClearButton = computed(() => this.showClear() && !this.isEmpty() && !this.inactive());
  readonly canOpenDropdown = computed(() => this.hasDropdown() && !this.inactive());
  readonly renderDropdown = computed(() => this.hasDropdown() && (!this.inactive() || this.dropdownOpen()));
  readonly activeOptionId = computed(() =>
    this.dropdownOpen() && this.filteredCountries()[this.focusedIndex()]
      ? this.getOptionId(this.focusedIndex())
      : undefined
  );
  readonly rootClasses = computed(() =>
    [
      'phone-input',
      `size-${this.size()}`,
      this.themeClass(),
      this.isDisabled() && 'is-disabled',
      this.isReadOnly() && 'is-readonly',
      this.disableDefaultStyles() && 'is-unstyled',
      this.withValidity() && this.incomplete() && 'is-incomplete',
      this.withValidity() && this.isCompleteSignal() && 'is-complete'
    ]
      .filter(Boolean)
      .join(' ')
  );
  readonly dropdownClasses = computed(() =>
    ['phone-dropdown', this.dropdownOpen() && 'is-open', this.dropdownClass(), this.themeClass()]
      .filter(Boolean)
      .join(' ')
  );
  readonly actionsCount = computed(
    () => +this.showCopyButton() + +this.showClearButton() + (this.actionsBeforeTemplate() ? 1 : 0)
  );

  constructor() {
    this.countryState.configure({
      country: this.countryInput,
      locale: this.localeInput,
      detect: this.detectInput,
      onCountryChange: (country) => this.countryChange.emit(country)
    });

    this.formatterState.configure({
      country: this.country,
      value: this.value,
      onChange: (digits) => this.setValue(digits, true),
      onPhoneChange: (phone) => this.phoneChange.emit(phone),
      onValidationChange: (isComplete) => this.validationChange.emit(isComplete)
    });

    this.inputHandlers.configure({
      formatter: this.formatter,
      digits: this.digits,
      inactive: this.inactive,
      onChange: (digits) => this.setValue(digits, true),
      scheduleValidationHint: (delay) => this.validationHint.scheduleValidationHint(delay)
    });

    this.countrySelector.configure({
      rootElement: () => this.rootRef()?.nativeElement,
      dropdownElement: () => this.dropdownRef()?.nativeElement,
      searchElement: () => this.searchRef()?.nativeElement,
      selectorElement: () => this.selectorRef()?.nativeElement,
      locale: this.locale,
      inactive: this.inactive,
      countryOption: this.countryInput,
      onSelectCountry: (country) => this.selectCountry(country),
      onAfterSelect: () => this.focus()
    });

    this.copyAction.configure({
      fullFormatted: this.fullFormatted,
      liveElement: () => this.liveRef()?.nativeElement,
      onCopy: (value) => this.copiedValue.emit(value)
    });

    this.themeState.configure({ theme: this.theme });

    effect((onCleanup) => {
      if (typeof document === 'undefined') return;

      const dropdown = this.dropdownRef()?.nativeElement;
      if (!dropdown || dropdown.parentElement === document.body) return;

      const placeholder = document.createComment('phone-input-dropdown');
      const parent = dropdown.parentNode;
      parent?.insertBefore(placeholder, dropdown);
      document.body.appendChild(dropdown);

      onCleanup(() => {
        if (placeholder.parentNode && dropdown.isConnected) {
          placeholder.parentNode.insertBefore(dropdown, placeholder);
        }
        placeholder.remove();
      });
    });
  }

  writeValue(value: string | number | null | undefined): void {
    this.setValue(String(value ?? ''), false);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  focus(): void {
    setTimeout(() => this.telRef()?.nativeElement.focus());
  }

  blur(): void {
    this.telRef()?.nativeElement.blur();
  }

  clear(): void {
    this.setValue('', true);
    this.validationHint.clearValidationHint();
    this.cleared.emit();
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

  getFullNumber(): string {
    return this.full();
  }

  getFullFormattedNumber(): string {
    return this.fullFormatted();
  }

  getDigits(): string {
    return this.digits();
  }

  isValid(): boolean {
    return this.isComplete();
  }

  isComplete(): boolean {
    return this.isCompleteSignal();
  }

  getOptionId(index: number): string {
    return `pi-option-${this.dropdownId}-${index}`;
  }

  flagContext(country: MaskFull): { $implicit: MaskFull; country: MaskFull } {
    return { $implicit: country, country };
  }

  copyContext(): { copied: boolean } {
    return { copied: this.copied() };
  }

  handleBeforeInput(event: Event): void {
    this.inputHandlers.handleBeforeInput(event);
  }

  handleInput(event: Event): void {
    this.inputHandlers.handleInput(event);
  }

  handleKeydown(event: KeyboardEvent): void {
    this.inputHandlers.handleKeydown(event);
  }

  handlePaste(event: ClipboardEvent): void {
    this.inputHandlers.handlePaste(event);
  }

  handleFocus(event: FocusEvent): void {
    this.validationHint.clearValidationHint(false);
    this.countrySelector.closeDropdown();
    this.focused.emit(event);
  }

  handleBlur(event: FocusEvent): void {
    this.onTouched();
    this.blurred.emit(event);
  }

  handleSelectorPointerDown(event: PointerEvent): void {
    this.countrySelector.handleSelectorPointerDown(event);
  }

  handleSelectorKeydown(event: KeyboardEvent): void {
    this.countrySelector.handleSelectorKeydown(event);
  }

  handleSearchChange(event: Event): void {
    this.countrySelector.handleSearchChange(event);
  }

  handleSearchKeydown(event: KeyboardEvent): void {
    this.countrySelector.handleSearchKeydown(event);
  }

  toggleDropdown(): void {
    this.countrySelector.toggleDropdown();
  }

  setFocusedIndex(index: number): void {
    this.countrySelector.setFocusedIndex(index);
  }

  selectDropdownCountry(country: CountryKey): void {
    this.countrySelector.selectCountry(country);
  }

  onClearClick(): void {
    this.clear();
    this.focus();
  }

  async onCopyClick(): Promise<void> {
    await this.copyAction.onCopyClick();
  }

  private setValue(value: string, emit: boolean): void {
    const nextDigits = extractDigits(value, this.formatter().getMaxDigits());

    untracked(() => this.value.set(nextDigits));

    if (emit) {
      this.onChange(nextDigits);
    }
  }
}
