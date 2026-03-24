import {
  getFlagEmoji,
  countPlaceholders,
  formatDigitsWithMap,
  pickMaskVariant,
  removeCountryCodePrefix
} from '@desource/phone-mask';
import type { Component } from 'svelte';

import './style.scss'; // Importing styles just for vite build, no side effects in js chunks

import PhoneInputComponent from './components/PhoneInput.svelte';

export { usePhoneMask } from './composables/usePhoneMask.svelte';
export { phoneMaskAttachment } from './directives/phoneMaskAttachment.svelte';
export { phoneMaskAction } from './directives/phoneMaskAction';

import type { PhoneInputProps, PhoneInputExposed } from './types';
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

export type { PhoneNumber as PMaskPhoneNumber, Size as PhoneInputSize, Theme as PhoneInputTheme } from './types';

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
  removeCountryCodePrefix
};
