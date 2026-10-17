import { Pipe, type PipeTransform } from '@angular/core';
import { MasksWithFlagMap, type CountryKey } from '@desource/phone-mask';
import { countPlaceholders, extractDigits, formatDigitsWithMap, pickMaskVariant } from '@desource/phone-mask/kit';
import type { PhonePipeOptions } from './types';

/** Format national or explicitly international phone numbers for display. */
@Pipe({ name: 'phone' })
export class PhonePipe implements PipeTransform {
  transform(value: string | null | undefined, country: CountryKey, options: PhonePipeOptions = {}): string {
    if (!value?.trim()) return '';
    const resolved = MasksWithFlagMap[country?.toUpperCase() as CountryKey];
    if (!resolved || !/^\+?[\d\s().-]+$/.test(value.trim())) return value;

    let digits = extractDigits(value);
    if (value.trimStart().startsWith('+')) {
      const prefix = resolved.code.slice(1);
      if (!digits.startsWith(prefix)) return value;
      digits = digits.slice(prefix.length);
    }

    const mask = pickMaskVariant(resolved.mask, digits.length);
    if (!digits || digits.length > countPlaceholders(mask)) return value;

    let display = formatDigitsWithMap(mask, digits).display.replace(/\D+/g, ' ').trim();
    if (options.code !== false) display = `${resolved.code} ${display}`;
    if (options.flag) display = `${resolved.flag} ${display}`;
    return display;
  }
}
