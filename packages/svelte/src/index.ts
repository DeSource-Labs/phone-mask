import type { Component } from 'svelte';

import PhoneInputComponent from './components/PhoneInput.svelte';
export { usePhoneMask } from './composables/usePhoneMask.svelte.js';
export { phoneMaskAttachment } from './directives/phoneMaskAttachment.svelte.js';
export { phoneMaskAction } from './directives/phoneMaskAction.js';

import type { PhoneInputProps, PhoneInputExposed } from './types.js';
export type {
  UsePhoneMaskOptions,
  UsePhoneMaskReturn,
  PhoneInputProps,
  PhoneInputExposed,
  PhoneMaskBindingOptions,
  PhoneMaskBindingState,
  PhoneMaskBindingElement
} from './types.js';

export const PhoneInput = PhoneInputComponent as unknown as Component<PhoneInputProps, PhoneInputExposed>;

export type { PhoneNumber as PMaskPhoneNumber, Size as PhoneInputSize, Theme as PhoneInputTheme } from './types.js';

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
