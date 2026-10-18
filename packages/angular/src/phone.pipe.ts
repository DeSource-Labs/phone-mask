import { Pipe, type PipeTransform } from '@angular/core';
import { MasksWithFlagMap, type CountryKey } from '@desource/phone-mask';
import {
  countPlaceholders,
  detectCountryFromPhone,
  extractDigits,
  formatDigitsWithMap,
  pickMaskVariant
} from '@desource/phone-mask/kit';
import type { PhonePipeOptions } from './types';

/** Format phone numbers with or without an explicit calling code for display. */
@Pipe({ name: 'phone' })
export class PhonePipe implements PipeTransform {
  transform(value: string | null | undefined, country?: CountryKey | null, options: PhonePipeOptions = {}): string {
    if (!value?.trim()) return '';
    let resolved = country == null ? undefined : MasksWithFlagMap[country.toUpperCase() as CountryKey];
    if ((country != null && !resolved) || !/^\+?[\d\s().-]+$/.test(value.trim())) return value;

    let digits = extractDigits(value);
    if (value.trimStart().startsWith('+')) {
      if (!resolved || !digits.startsWith(resolved.code.slice(1))) {
        const detected = detectCountryFromPhone(value);
        resolved = detected ? MasksWithFlagMap[detected] : undefined;
      }
      if (!resolved) return value;
      digits = digits.slice(resolved.code.length - 1);
    }
    if (!resolved) return value;

    const mask = pickMaskVariant(resolved.mask, digits.length);
    if (!digits || digits.length > countPlaceholders(mask)) return value;

    let display = formatDigitsWithMap(mask, digits).display.replace(/\D+/g, ' ').trim();
    if (options.code !== false) display = `${resolved.code} ${display}`;
    if (options.flag) display = `${resolved.flag} ${display}`;
    return display;
  }
}
