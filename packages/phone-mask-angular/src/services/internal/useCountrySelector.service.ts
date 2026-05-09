import { Injectable, Injector, computed, effect, inject, signal } from '@angular/core';
import { MasksFull, type CountryKey, type MaskFull } from '@desource/phone-mask';
import {
  bindCountryDropdownListeners,
  filterCountries,
  handleCountryButtonKeydown,
  handleCountrySearchKeydown,
  positionCountryDropdown,
  scrollCountryOptionIntoView
} from '@desource/phone-mask/kit';

type IndexUpdate = number | ((index: number) => number);

interface UseCountrySelectorOptions {
  rootElement: () => HTMLElement | null | undefined;
  dropdownElement: () => HTMLElement | null | undefined;
  searchElement: () => HTMLInputElement | null | undefined;
  selectorElement: () => HTMLButtonElement | null | undefined;
  locale: () => string;
  inactive?: () => boolean;
  countryOption?: () => string | undefined;
  onSelectCountry: (code: CountryKey) => void;
  onAfterSelect?: () => void;
}

@Injectable()
export class UseCountrySelectorService {
  private readonly injector = inject(Injector);
  private rootElementGetter: () => HTMLElement | null | undefined = () => undefined;
  private dropdownElementGetter: () => HTMLElement | null | undefined = () => undefined;
  private searchElementGetter: () => HTMLInputElement | null | undefined = () => undefined;
  private selectorElementGetter: () => HTMLButtonElement | null | undefined = () => undefined;
  private localeGetter = () => 'en';
  private inactiveGetter = () => false;
  private countryOptionGetter: () => string | undefined = () => undefined;
  private onSelectCountry: (code: CountryKey) => void = () => {};
  private onAfterSelect: (() => void) | undefined;
  private openByKeyboard = false;
  private configured = false;

  readonly dropdownOpen = signal(false);
  readonly search = signal('');
  readonly focusedIndex = signal(0);
  readonly countries = computed(() => MasksFull(this.localeGetter()));
  readonly filteredCountries = computed(() => filterCountries(this.countries(), this.search()));
  readonly hasDropdown = computed(() => !this.countryOptionGetter() && this.countries().length > 1);

  configure(options: UseCountrySelectorOptions): void {
    if (this.configured) return;
    this.configured = true;

    this.rootElementGetter = options.rootElement;
    this.dropdownElementGetter = options.dropdownElement;
    this.searchElementGetter = options.searchElement;
    this.selectorElementGetter = options.selectorElement;
    this.localeGetter = options.locale;
    this.inactiveGetter = options.inactive ?? this.inactiveGetter;
    this.countryOptionGetter = options.countryOption ?? this.countryOptionGetter;
    this.onSelectCountry = options.onSelectCountry;
    this.onAfterSelect = options.onAfterSelect;

    effect(
      () => {
        if ((this.inactiveGetter() || !this.hasDropdown()) && this.dropdownOpen()) {
          this.closeDropdown();
        }
      },
      { injector: this.injector }
    );

    effect(
      (onCleanup) => {
        if (!this.dropdownOpen()) return;

        queueMicrotask(() => {
          this.updateDropdownPosition();
          if (this.openByKeyboard) this.focusSearch();
        });

        onCleanup(
          bindCountryDropdownListeners(
            () => this.dropdownElementGetter(),
            () => this.selectorElementGetter(),
            () => this.closeDropdown(),
            () => this.updateDropdownPosition()
          )
        );
      },
      { injector: this.injector }
    );
  }

  openDropdown(): void {
    if (this.inactiveGetter() || !this.hasDropdown() || this.dropdownOpen()) return;
    if (!this.dropdownElementGetter() || !this.selectorElementGetter()) return;

    this.updateDropdownPosition();
    this.focusedIndex.set(0);
    this.dropdownOpen.set(true);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
    this.resetDropdownState();
  }

  toggleDropdown(): void {
    if (this.inactiveGetter() || !this.hasDropdown()) return;
    if (this.dropdownOpen()) this.closeDropdown();
    else this.openDropdown();
  }

  selectCountry(code: CountryKey): void {
    this.onSelectCountry(code);
    this.closeDropdown();
    this.onAfterSelect?.();
  }

  setFocusedIndex(index: IndexUpdate): void {
    this.focusedIndex.update((current) => (typeof index === 'function' ? index(current) : index));
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
      (country: MaskFull) => this.selectCountry(country.id)
    );
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

  private resetDropdownState(): void {
    this.search.set('');
    this.focusedIndex.set(0);
    this.openByKeyboard = false;
  }

  private updateDropdownPosition(): void {
    positionCountryDropdown(this.rootElementGetter() ?? null, this.dropdownElementGetter() ?? null);
  }

  private focusSearch(): void {
    setTimeout(() => this.searchElementGetter()?.focus({ preventScroll: true }));
  }

  private scrollFocusedIntoView(index: number): void {
    setTimeout(() => scrollCountryOptionIntoView(this.dropdownElementGetter(), index));
  }
}
