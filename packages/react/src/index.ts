export { PhoneInput } from './components/PhoneInput.js';
export { usePhoneMask } from './hooks/usePhoneMask.js';

export type {
  PhoneInputProps,
  PhoneInputRef,
  PhoneNumber,
  PhoneNumber as PMaskPhoneNumber,
  UsePhoneMaskOptions,
  UsePhoneMaskReturn,
  Size as PhoneInputSize,
  Theme as PhoneInputTheme
} from './types.js';

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
