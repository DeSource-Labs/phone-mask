import { Inject, Injectable, Optional } from '@angular/core';
import type { CountryKey, MaskFull } from '@desource/phone-mask';
import { createPhoneFormatter, extractDigits, type FormatterHelpers } from '@desource/phone-mask/kit';
import { PHONE_MASK_CONFIG } from './config';
import {
  createPhoneNumber,
  createPhoneState,
  formatPhoneValue,
  resolveCountry,
  resolveLocale
} from './internal/formatting';
import type {
  PhoneMaskConfig,
  PhoneMaskFormatMode,
  PhoneMaskFormatOptions,
  PhoneMaskState,
  PhoneNumber
} from './types';

function isMaskFull(value: unknown): value is MaskFull {
  return !!value && typeof value === 'object' && 'code' in value && 'mask' in value;
}

function isFormatOptions(value: unknown): value is PhoneMaskFormatOptions {
  return !!value && typeof value === 'object';
}

@Injectable({
  providedIn: 'root'
})
export class PhoneMaskService {
  constructor(@Optional() @Inject(PHONE_MASK_CONFIG) private readonly config: PhoneMaskConfig = {}) {}

  getLocale(locale?: string): string {
    return resolveLocale(locale, this.config);
  }

  getCountry(country?: CountryKey | string | null, locale?: string): MaskFull {
    return resolveCountry(country, locale, this.config);
  }

  createFormatter(country?: CountryKey | string | MaskFull | null, locale?: string): FormatterHelpers {
    if (isMaskFull(country)) return createPhoneFormatter(country);
    return createPhoneFormatter(this.getCountry(country as CountryKey | string | null | undefined, locale));
  }

  getDigits(value: string | number | null | undefined, country?: CountryKey | string | MaskFull | null): string {
    const formatter = this.createFormatter(country);
    return extractDigits(String(value ?? ''), formatter.getMaxDigits());
  }

  getPhoneNumber(
    value: string | number | null | undefined,
    country?: CountryKey | string | MaskFull | null,
    locale?: string
  ): PhoneNumber {
    const resolvedCountry = isMaskFull(country)
      ? country
      : this.getCountry(country as CountryKey | string | null | undefined, locale);
    const formatter = createPhoneFormatter(resolvedCountry);
    const digits = extractDigits(String(value ?? ''), formatter.getMaxDigits());

    return createPhoneNumber(digits, resolvedCountry, formatter);
  }

  getState(
    value: string | number | null | undefined,
    country?: CountryKey | string | MaskFull | null,
    locale?: string
  ): PhoneMaskState {
    const resolvedCountry = isMaskFull(country)
      ? country
      : this.getCountry(country as CountryKey | string | null | undefined, locale);
    return createPhoneState(value, resolvedCountry);
  }

  format(
    value: string | number | null | undefined,
    countryOrOptions?: CountryKey | string | PhoneMaskFormatOptions,
    mode: PhoneMaskFormatMode = 'display',
    locale?: string
  ): string {
    const options: PhoneMaskFormatOptions = isFormatOptions(countryOrOptions)
      ? countryOrOptions
      : { country: countryOrOptions as CountryKey | string | undefined, mode, locale };

    return formatPhoneValue(value, options, this.config);
  }

  isComplete(
    value: string | number | null | undefined,
    country?: CountryKey | string | MaskFull | null,
    locale?: string
  ): boolean {
    return this.getState(value, country, locale).isComplete;
  }
}
