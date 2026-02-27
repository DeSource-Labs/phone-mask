import {
  getFlagEmoji,
  countPlaceholders,
  formatDigitsWithMap,
  pickMaskVariant,
  removeCountryCodePrefix,
  toArray
} from '@desource/phone-mask';

export { default as PhoneInput } from './components/PhoneInput.svelte';
export { usePhoneMask } from './composables/usePhoneMask.svelte';

import type { PhoneNumber as PMaskPhoneNumber, Size as PhoneInputSize, Theme as PhoneInputTheme } from './types';
export type { UsePhoneMaskOptions, UsePhoneMaskReturn } from './types';

export { type PMaskPhoneNumber, type PhoneInputSize, type PhoneInputTheme };

export type {
  CountryKey as PCountryKey,
  MaskBase as PMaskBase,
  MaskBaseMap as PMaskBaseMap,
  Mask as PMask,
  MaskMap as PMaskMap,
  MaskWithFlag as PMaskWithFlag,
  MaskWithFlagMap as PMaskWithFlagMap,
  MaskFull as PMaskFull,
  MaskFullMap as PMaskFullMap
} from '@desource/phone-mask';

export const PMaskHelpers = {
  getFlagEmoji,
  countPlaceholders,
  formatDigitsWithMap,
  pickMaskVariant,
  removeCountryCodePrefix,
  toArray
};
