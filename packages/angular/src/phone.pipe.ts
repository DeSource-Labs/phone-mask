import { Pipe, type PipeTransform } from '@angular/core';
import type { CountryKey } from '@desource/phone-mask';
import { formatPhone } from '@desource/phone-mask/kit';
import type { PhonePipeOptions } from './types';

/** Format phone numbers with or without an explicit calling code for display. */
@Pipe({ name: 'phone' })
export class PhonePipe implements PipeTransform {
  transform(value: string | null | undefined, country?: CountryKey | null, options?: PhonePipeOptions): string {
    return formatPhone(value, country, options);
  }
}
