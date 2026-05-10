import { Pipe, type PipeTransform } from '@angular/core';
import type { CountryKey } from '@desource/phone-mask';
import {
  createPhoneFormatter,
  extractDigits,
  getCountry,
  getNavigatorLang,
  parseCountryCode
} from '@desource/phone-mask/kit';
import type { PhoneMaskFormatMode, PhoneMaskFormatOptions } from './types';

const DEFAULT_COUNTRY = 'US';

function isFormatOptions(value: unknown): value is PhoneMaskFormatOptions {
  return !!value && typeof value === 'object';
}

function formatPhoneValue(value: string | number | null | undefined, options: PhoneMaskFormatOptions): string {
  const mode: PhoneMaskFormatMode = options.mode ?? 'display';
  const country = getCountry(parseCountryCode(options.country, DEFAULT_COUNTRY), options.locale || getNavigatorLang());
  const formatter = createPhoneFormatter(country);
  const digits = extractDigits(String(value ?? ''), formatter.getMaxDigits());
  const displayValue = formatter.formatDisplay(digits);

  if (mode === 'placeholder') return formatter.getPlaceholder();
  if (mode === 'full') return digits ? `${country.code}${digits}` : '';
  if (mode === 'fullFormatted') return displayValue ? `${country.code} ${displayValue}` : '';

  return displayValue;
}

@Pipe({
  name: 'phoneMask',
  standalone: true,
  pure: true
})
export class PhoneMaskPipe implements PipeTransform {
  transform(
    value: string | number | null | undefined,
    countryOrOptions?: CountryKey | string | PhoneMaskFormatOptions,
    mode: PhoneMaskFormatMode = 'display',
    locale?: string
  ): string {
    const options: PhoneMaskFormatOptions = isFormatOptions(countryOrOptions)
      ? countryOrOptions
      : { country: countryOrOptions, mode, locale };

    return formatPhoneValue(value, options);
  }
}
