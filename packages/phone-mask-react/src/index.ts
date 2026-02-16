import {
  getFlagEmoji,
  countPlaceholders,
  formatDigitsWithMap,
  pickMaskVariant,
  removeCountryCodePrefix,
  toArray
} from '@desource/phone-mask';

export { PhoneInput } from './components/PhoneInput';
export { usePhoneMask } from './hooks/usePhoneMask';
export { usePhoneMaskCore } from './hooks/usePhoneMaskCore';
export { usePhoneInputHandlers } from './hooks/usePhoneInputHandlers';
export type {
  PhoneInputProps,
  PhoneInputRef,
  PhoneNumber,
  UsePhoneMaskOptions,
  UsePhoneMaskReturn,
  UsePhoneMaskCoreReturn,
  Size as PhoneInputSize,
  Theme as PhoneInputTheme
} from './types';

export type { UsePhoneInputHandlersOptions, UsePhoneInputHandlersReturn } from './hooks/usePhoneInputHandlers';

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
