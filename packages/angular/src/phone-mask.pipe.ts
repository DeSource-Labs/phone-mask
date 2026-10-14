import { Pipe, type PipeTransform } from '@angular/core';
import { MasksMap, type CountryKey } from '@desource/phone-mask';
import { createPhoneFormatter, extractDigits } from '@desource/phone-mask/kit';

/** Format national digits; set includeCountryCode to include the country calling code. */
@Pipe({ name: 'phoneMask' })
export class PhoneMaskPipe implements PipeTransform {
  transform(value: string | null | undefined, country: CountryKey = 'US', includeCountryCode = false): string {
    if (!value) return '';
    const resolved = MasksMap[country.toUpperCase() as CountryKey] ?? MasksMap.US;
    const formatter = createPhoneFormatter(resolved);
    const display = formatter.formatDisplay(extractDigits(value, formatter.getMaxDigits()));
    return includeCountryCode && display ? `${resolved.code} ${display}` : display;
  }
}
