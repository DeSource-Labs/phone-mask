export { PhoneInputComponent } from './components/phone-input/phone-input.component';
export { PhoneMaskDirective } from './phone-mask.directive';
export { PhonePipe } from './phone.pipe';
export { usePhoneMask } from './services/usePhoneMask.service';
export type {
  MaybeGetter,
  PhoneInputExposed,
  PhoneInputProps,
  PhoneMaskDirectiveOptions,
  PhoneNumber,
  PhonePipeOptions,
  Size,
  Theme,
  UsePhoneMaskOptions,
  UsePhoneMaskReturn
} from './types';
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
