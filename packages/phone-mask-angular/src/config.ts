import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import type { PhoneMaskConfig } from './types';

export const PHONE_MASK_CONFIG = new InjectionToken<PhoneMaskConfig>('PHONE_MASK_CONFIG', {
  providedIn: 'root',
  factory: () => ({})
});

export function providePhoneMask(config: PhoneMaskConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: PHONE_MASK_CONFIG,
      useValue: config
    }
  ]);
}
