import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  Inject,
  Optional,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  forwardRef,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { MasksFull, type CountryKey, type MaskFull } from '@desource/phone-mask';
import {
  bindCountryDropdownListeners,
  createPhoneFormatter,
  detectByGeoIp,
  detectCountryFromLocale,
  extractDigits,
  filterCountries,
  getCountry,
  getNavigatorLang,
  handleCountryButtonKeydown,
  handleCountrySearchKeydown,
  parseCountryCode,
  positionCountryDropdown,
  processBeforeInput,
  processInput,
  processKeydown,
  processPaste,
  scrollCountryOptionIntoView,
  setCaret
} from '@desource/phone-mask/kit';
import { PHONE_MASK_CONFIG } from '../config';
import { optionalBooleanAttribute } from '../internal/boolean-input';
import { createPhoneNumber } from '../internal/formatting';
import type { PhoneInputRef, PhoneMaskConfig, PhoneNumber, Size, Theme } from '../types';

type IndexUpdate = number | ((index: number) => number);

const HINT_DELAY_INPUT = 500;
const HINT_DELAY_ACTION = 300;
const COPY_RESET_DELAY = 1_800;

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
  readonly detectInput = input<boolean | undefined, unknown>(undefined, {
    alias: 'detect',
    transform: optionalBooleanAttribute
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

  private readonly countryCode = signal('US');
  private readonly formDisabled = signal(false);
  private readonly systemDark = signal(false);
  private readonly showValidationHint = signal(false);
  readonly copied = signal(false);

  readonly dropdownOpen = signal(false);
  readonly search = signal('');
  readonly focusedIndex = signal(0);

  readonly dropdownId = ++nextDropdownId;
  readonly dropdownElementId = `pi-dropdown-${this.dropdownId}`;
  readonly listboxId = `pi-options-${this.dropdownId}`;

  private validationTimer: ReturnType<typeof setTimeout> | undefined;
  private copyTimer: ReturnType<typeof setTimeout> | undefined;
  private themeMediaQuery: MediaQueryList | undefined;
  private openByKeyboard = false;
  private detectionKey = '';

  private onTouched: () => void = () => {};
  private onChange: (value: string) => void = () => {};

  readonly locale = computed(() => this.localeInput() || this.config.locale || getNavigatorLang());
  readonly detect = computed(() => this.detectInput() ?? this.config.detect ?? !this.config.country);
  readonly country = computed(() => getCountry(this.countryCode(), this.locale()));
  readonly countries = computed(() => MasksFull(this.locale()));
  readonly formatter = computed(() => createPhoneFormatter(this.country()));
  readonly digits = computed(() => extractDigits(this.value(), this.formatter().getMaxDigits()));
  readonly displayPlaceholder = computed(() => this.formatter().getPlaceholder());
  readonly displayValue = computed(() => this.formatter().formatDisplay(this.digits()));
  readonly phoneData = computed(() => createPhoneNumber(this.digits(), this.country(), this.formatter()));
  readonly full = computed(() => this.phoneData().full);
  readonly fullFormatted = computed(() => this.phoneData().fullFormatted);
  readonly isCompleteSignal = computed(() => this.formatter().isComplete(this.digits()));
  readonly isEmpty = computed(() => this.digits().length === 0);
  readonly shouldShowWarn = computed(() => !this.isEmpty() && !this.isCompleteSignal());
  readonly isDisabled = computed(() => this.disabledInput() || this.formDisabled());
  readonly isReadOnly = computed(() => this.readOnlyInput());
  readonly inactive = computed(() => this.isDisabled() || this.isReadOnly());
  readonly incomplete = computed(() => this.showValidationHint() && this.shouldShowWarn());
  readonly showCopyButton = computed(() => this.showCopy() && !this.isEmpty() && !this.isDisabled());
  readonly showClearButton = computed(() => this.showClear() && !this.isEmpty() && !this.inactive());
  readonly filteredCountries = computed(() => filterCountries(this.countries(), this.search()));
  readonly hasDropdown = computed(() => !this.countryInput() && this.countries().length > 1);
  readonly canOpenDropdown = computed(() => this.hasDropdown() && !this.inactive());
  readonly renderDropdown = computed(() => this.hasDropdown() && (!this.inactive() || this.dropdownOpen()));
  readonly activeOptionId = computed(() =>
    this.dropdownOpen() && this.filteredCountries()[this.focusedIndex()]
      ? this.getOptionId(this.focusedIndex())
      : undefined
  );
  readonly themeClass = computed(() => {
    const theme = this.theme();
    if (theme === 'auto') return this.systemDark() ? 'theme-dark' : 'theme-light';
    return `theme-${theme}`;
  });
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
  readonly copyAriaLabel = computed(() => (this.copied() ? 'Copied' : `Copy ${this.fullFormatted()}`));
  readonly copyButtonTitle = computed(() => (this.copied() ? 'Copied' : 'Copy phone number'));

  constructor(
    private readonly destroyRef: DestroyRef,
    private readonly cdr: ChangeDetectorRef,
    @Optional() @Inject(DOCUMENT) private readonly document: Document | null,
    @Optional() @Inject(PHONE_MASK_CONFIG) private readonly config: PhoneMaskConfig = {}
  ) {
    this.countryCode.set(parseCountryCode(this.config.country, 'US'));
    this.bindThemePreference();

    this.destroyRef.onDestroy(() => {
      if (this.validationTimer) clearTimeout(this.validationTimer);
      if (this.copyTimer) clearTimeout(this.copyTimer);
      this.themeMediaQuery?.removeEventListener('change', this.handleThemeChange);
    });

    effect(() => {
      const country = parseCountryCode(this.countryInput());

      if (country && country !== this.countryCode()) {
        queueMicrotask(() => this.selectCountry(country));
      }
    });

    effect(() => {
      if (!this.detect() || this.countryInput() || this.config.country) return;

      const key = `${this.locale()}:${this.detect()}`;
      if (this.detectionKey === key) return;

      this.detectionKey = key;
      void this.detectCountry();
    });

    effect(() => {
      const value = this.value();
      const digits = this.digits();

      if (value !== digits) {
        queueMicrotask(() => {
          if (this.value() !== this.digits()) {
            this.setValue(this.digits(), false);
          }
        });
      }
    });

    effect(() => {
      this.phoneChange.emit(this.phoneData());
    });

    effect(() => {
      this.validationChange.emit(this.isCompleteSignal());
    });

    effect(() => {
      this.countryChange.emit(this.country());
    });

    effect((onCleanup) => {
      if (!this.dropdownOpen()) return;

      queueMicrotask(() => {
        this.updateDropdownPosition();
        if (this.openByKeyboard) this.focusSearch();
      });

      onCleanup(
        bindCountryDropdownListeners(
          () => this.dropdownRef()?.nativeElement,
          () => this.selectorRef()?.nativeElement,
          () => this.closeDropdown(),
          () => this.updateDropdownPosition()
        )
      );
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
    this.clearValidationHint();
    this.cleared.emit();
  }

  selectCountry(country: CountryKey | string): boolean {
    const parsed = parseCountryCode(country);

    if (!parsed) return false;

    untracked(() => this.countryCode.set(parsed));

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
    processBeforeInput(event as InputEvent);
  }

  handleInput(event: Event): void {
    if (this.inactive()) return;

    const result = processInput(event, { formatter: this.formatter() });
    if (!result) return;

    this.setValue(result.newDigits, true);
    this.scheduleCaretUpdate(event.target as HTMLInputElement | null, result.caretDigitIndex);
    this.scheduleValidationHint(HINT_DELAY_INPUT);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.inactive()) return;

    const result = processKeydown(event, { digits: this.digits(), formatter: this.formatter() });
    if (!result) return;

    this.setValue(result.newDigits, true);
    this.scheduleCaretUpdate(event.target as HTMLInputElement | null, result.caretDigitIndex);
    this.scheduleValidationHint(HINT_DELAY_ACTION);
  }

  handlePaste(event: ClipboardEvent): void {
    if (this.inactive()) return;

    const result = processPaste(event, { digits: this.digits(), formatter: this.formatter() });
    if (!result) return;

    this.setValue(result.newDigits, true);
    this.scheduleCaretUpdate(event.target as HTMLInputElement | null, result.caretDigitIndex);
    this.scheduleValidationHint(HINT_DELAY_ACTION);
  }

  handleFocus(event: FocusEvent): void {
    this.clearValidationHint(false);
    this.closeDropdown();
    this.focused.emit(event);
  }

  handleBlur(event: FocusEvent): void {
    this.onTouched();
    this.blurred.emit(event);
  }

  handleSelectorPointerDown(event: PointerEvent): void {
    this.openByKeyboard = event.pointerType === 'mouse';
  }

  handleSelectorKeydown(event: KeyboardEvent): void {
    handleCountryButtonKeydown(
      event,
      this.dropdownOpen(),
      () => {
        this.openByKeyboard = true;
      },
      () => this.focusSearch(),
      () => this.openDropdown()
    );
  }

  handleSearchChange(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.focusedIndex.set(0);
  }

  handleSearchKeydown(event: KeyboardEvent): void {
    handleCountrySearchKeydown(
      event,
      this.focusedIndex(),
      this.filteredCountries(),
      (index) => this.setFocusedIndex(index),
      (index) => this.scrollFocusedIntoView(index),
      (country) => this.selectDropdownCountry(country.id)
    );
  }

  toggleDropdown(): void {
    if (this.inactive() || !this.hasDropdown()) return;

    if (this.dropdownOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown(): void {
    if (this.inactive() || !this.hasDropdown() || this.dropdownOpen()) return;
    if (!this.dropdownRef()?.nativeElement || !this.selectorRef()?.nativeElement) return;

    this.updateDropdownPosition();
    this.focusedIndex.set(0);
    this.dropdownOpen.set(true);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
    this.resetDropdownState();
  }

  setFocusedIndex(index: IndexUpdate): void {
    this.focusedIndex.update((current) => (typeof index === 'function' ? index(current) : index));
  }

  selectDropdownCountry(country: CountryKey | string): void {
    this.selectCountry(country);
    this.closeDropdown();
    this.focus();
  }

  onClearClick(): void {
    this.clear();
    this.focus();
  }

  async onCopyClick(): Promise<void> {
    const value = this.fullFormatted().trim();
    const success = await this.copyToClipboard(value);

    if (!success) return;

    this.copied.set(true);
    this.copiedValue.emit(value);
    this.announceToScreenReader('Phone number copied to clipboard');

    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => {
      this.copied.set(false);
      this.cdr.markForCheck();
    }, COPY_RESET_DELAY);
  }

  private setValue(value: string, emit: boolean): void {
    const nextDigits = extractDigits(value, this.formatter().getMaxDigits());

    untracked(() => this.value.set(nextDigits));

    if (emit) {
      this.onChange(nextDigits);
    }
  }

  private async detectCountry(): Promise<void> {
    const geoCountry = parseCountryCode(await detectByGeoIp());

    if (geoCountry && this.selectCountry(geoCountry)) return;

    this.selectCountry(detectCountryFromLocale() ?? 'US');
  }

  private resetDropdownState(): void {
    this.search.set('');
    this.focusedIndex.set(0);
    this.openByKeyboard = false;
  }

  private updateDropdownPosition(): void {
    positionCountryDropdown(this.rootRef()?.nativeElement ?? null, this.dropdownRef()?.nativeElement ?? null);
  }

  private focusSearch(): void {
    setTimeout(() => this.searchRef()?.nativeElement.focus({ preventScroll: true }));
  }

  private scrollFocusedIntoView(index: number): void {
    setTimeout(() => scrollCountryOptionIntoView(this.dropdownRef()?.nativeElement, index));
  }

  private scheduleCaretUpdate(el: HTMLInputElement | null, digitIndex: number): void {
    setTimeout(() => {
      const position = this.formatter().getCaretPosition(digitIndex);
      setCaret(el, position);
    });
  }

  private clearValidationHint(hideHint = true): void {
    if (hideHint) this.showValidationHint.set(false);
    if (this.validationTimer) clearTimeout(this.validationTimer);
  }

  private scheduleValidationHint(delay: number): void {
    this.showValidationHint.set(false);
    if (this.validationTimer) clearTimeout(this.validationTimer);
    this.validationTimer = setTimeout(() => {
      this.showValidationHint.set(true);
      this.cdr.markForCheck();
    }, delay);
  }

  private announceToScreenReader(message: string): void {
    const live = this.liveRef()?.nativeElement;
    if (!live) return;

    live.textContent = message;
    setTimeout(() => {
      live.textContent = '';
    }, COPY_RESET_DELAY);
  }

  private async copyToClipboard(value: string): Promise<boolean> {
    if (!value) return false;

    try {
      if (globalThis.navigator?.clipboard?.writeText) {
        await globalThis.navigator.clipboard.writeText(value);
        return true;
      }

      if (!this.document?.body) return false;

      const textarea = this.document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      this.document.body.appendChild(textarea);
      textarea.select();
      const copied = this.document.execCommand('copy');
      textarea.remove();

      return copied;
    } catch {
      return false;
    }
  }

  private bindThemePreference(): void {
    this.themeMediaQuery = globalThis.matchMedia?.('(prefers-color-scheme: dark)') ?? undefined;
    if (!this.themeMediaQuery) return;

    this.systemDark.set(this.themeMediaQuery.matches);
    this.themeMediaQuery.addEventListener('change', this.handleThemeChange);
  }

  private readonly handleThemeChange = (event: MediaQueryListEvent) => {
    this.systemDark.set(event.matches);
    this.cdr.markForCheck();
  };
}
