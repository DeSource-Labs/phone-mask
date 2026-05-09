import { Injectable, Injector, computed, effect, inject, signal, untracked } from '@angular/core';
import type { CountryKey, MaskFull } from '@desource/phone-mask';
import {
  detectByGeoIp,
  detectCountryFromLocale,
  getCountry,
  getNavigatorLang,
  parseCountryCode
} from '@desource/phone-mask/kit';
import { PHONE_MASK_CONFIG } from '../../config';
import type { PhoneMaskConfig } from '../../types';

interface UseCountryOptions {
  country?: () => CountryKey | string | null | undefined;
  locale?: () => string | undefined;
  detect?: () => boolean | undefined;
  defaultDetect?: boolean;
  onCountryChange?: (country: MaskFull) => void;
}

@Injectable()
export class UseCountryService {
  private readonly injector = inject(Injector);
  private readonly config: PhoneMaskConfig = inject(PHONE_MASK_CONFIG, { optional: true }) ?? {};
  private countryOption: () => CountryKey | string | null | undefined = () => undefined;
  private localeOption: () => string | undefined = () => undefined;
  private detectOption: () => boolean | undefined = () => undefined;
  private defaultDetect = false;
  private onCountryChange: ((country: MaskFull) => void) | undefined;
  private detectionKey = '';
  private configured = false;

  readonly countryCode = signal('US');
  readonly locale = computed(() => this.localeOption() || this.config.locale || getNavigatorLang());
  readonly detect = computed(() => this.detectOption() ?? this.config.detect ?? this.defaultDetect);
  readonly country = computed(() => getCountry(this.countryCode(), this.locale()));

  constructor() {
    this.countryCode.set(parseCountryCode(this.config.country, 'US'));
  }

  configure(options: UseCountryOptions = {}): void {
    if (this.configured) return;
    this.configured = true;

    this.countryOption = options.country ?? this.countryOption;
    this.localeOption = options.locale ?? this.localeOption;
    this.detectOption = options.detect ?? this.detectOption;
    this.defaultDetect = options.defaultDetect ?? this.defaultDetect;
    this.onCountryChange = options.onCountryChange;

    effect(
      () => {
        const parsed = parseCountryCode(this.countryOption() ?? this.config.country);

        if (parsed && parsed !== this.countryCode()) {
          queueMicrotask(() => this.setCountry(parsed));
        }
      },
      { injector: this.injector }
    );

    effect(
      () => {
        if (!this.detect() || this.countryOption() || this.config.country) return;

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
