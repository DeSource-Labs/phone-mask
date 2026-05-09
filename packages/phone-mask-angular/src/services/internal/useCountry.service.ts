import { Injectable, Injector, computed, effect, inject, signal, untracked } from '@angular/core';
import type { CountryKey, MaskFull } from '@desource/phone-mask';
import {
  detectByGeoIp,
  detectCountryFromLocale,
  getCountry,
  getNavigatorLang,
  parseCountryCode
} from '@desource/phone-mask/kit';

interface UseCountryOptions {
  country?: () => CountryKey | string | null | undefined;
  locale?: () => string | undefined;
  detect?: () => boolean | undefined;
  onCountryChange?: (country: MaskFull) => void;
}

@Injectable()
export class UseCountryService {
  private readonly injector = inject(Injector);
  private countryOption: () => CountryKey | string | null | undefined = () => undefined;
  private localeOption: () => string | undefined = () => undefined;
  private detectOption: () => boolean | undefined = () => undefined;
  private onCountryChange: ((country: MaskFull) => void) | undefined;
  private detectionKey = '';
  private configured = false;

  readonly countryCode = signal('US');
  readonly locale = computed(() => this.localeOption() || getNavigatorLang());
  readonly detect = computed(() => this.detectOption() ?? true);
  readonly country = computed(() => getCountry(this.countryCode(), this.locale()));

  configure(options: UseCountryOptions = {}): void {
    if (this.configured) return;
    this.configured = true;

    this.countryOption = options.country ?? this.countryOption;
    this.localeOption = options.locale ?? this.localeOption;
    this.detectOption = options.detect ?? this.detectOption;
    this.onCountryChange = options.onCountryChange;

    const initialCountry = parseCountryCode(this.countryOption());
    if (initialCountry) {
      this.countryCode.set(initialCountry);
    }

    effect(
      () => {
        const parsed = parseCountryCode(this.countryOption());

        if (parsed && parsed !== this.countryCode()) {
          queueMicrotask(() => this.setCountry(parsed));
        }
      },
      { injector: this.injector }
    );

    effect(
      () => {
        if (!this.detect() || this.countryOption()) return;

        const key = `${this.locale()}:${this.detect()}`;
        if (this.detectionKey === key) return;

        this.detectionKey = key;
        void this.detectCountry();
      },
      { injector: this.injector }
    );

    effect(
      () => {
        this.onCountryChange?.(this.country());
      },
      { injector: this.injector }
    );
  }

  setCountry(countryCode?: CountryKey | string | null): boolean {
    const parsed = parseCountryCode(countryCode);

    if (!parsed) return false;

    untracked(() => this.countryCode.set(parsed));
    return true;
  }

  private async detectCountry(): Promise<void> {
    const geoCountry = parseCountryCode(await detectByGeoIp());

    if (geoCountry && this.setCountry(geoCountry)) return;

    this.setCountry(detectCountryFromLocale());
  }
}
