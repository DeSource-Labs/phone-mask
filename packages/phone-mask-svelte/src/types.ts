import type { MaskFull, CountryKey, FormatterHelpers } from '@desource/phone-mask';

export type Size = 'compact' | 'normal' | 'large';
export type Theme = 'auto' | 'light' | 'dark';

export type PhoneNumber = {
  full: string;
  fullFormatted: string;
  digits: string;
};
