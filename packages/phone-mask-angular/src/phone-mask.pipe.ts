import { Pipe, inject, type PipeTransform } from '@angular/core';
import type { CountryKey } from '@desource/phone-mask';
import { PHONE_MASK_CONFIG } from './config';
import { formatPhoneValue } from './internal/formatting';
import type { PhoneMaskConfig, PhoneMaskFormatMode, PhoneMaskFormatOptions } from './types';

function isFormatOptions(value: unknown): value is PhoneMaskFormatOptions {
  return !!value && typeof value === 'object';
}

@Pipe({
  name: 'phoneMask',
  standalone: true,
  pure: true
})
export class PhoneMaskPipe implements PipeTransform {
  private readonly config: PhoneMaskConfig = inject(PHONE_MASK_CONFIG, { optional: true }) ?? {};

  transform(
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
}
