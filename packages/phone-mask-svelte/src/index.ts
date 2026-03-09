import {
  getFlagEmoji,
  countPlaceholders,
  formatDigitsWithMap,
  pickMaskVariant,
  removeCountryCodePrefix,
  toArray
} from '@desource/phone-mask';
import type { Component } from 'svelte';
import PhoneInputComponent from './components/PhoneInput.svelte';

export { usePhoneMask } from './composables/usePhoneMask.svelte';
export { phoneMaskAttachment } from './directives/phoneMaskAttachment.svelte';
export { phoneMaskAction } from './directives/phoneMaskAction';
export { phoneMaskSetCountry } from './directives/helper';

import type {
  PhoneNumber as PMaskPhoneNumber,
  Size as PhoneInputSize,
  Theme as PhoneInputTheme,
  PhoneInputProps,
  PhoneInputExposed
} from './types';
export type {
  UsePhoneMaskOptions,
  UsePhoneMaskReturn,
  PhoneInputProps,
  PhoneInputExposed,
  PhoneMaskBindingOptions,
  PhoneMaskBindingState,
  PhoneMaskBindingElement
} from './types';

export const PhoneInput = PhoneInputComponent as unknown as Component<PhoneInputProps, PhoneInputExposed>;

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
