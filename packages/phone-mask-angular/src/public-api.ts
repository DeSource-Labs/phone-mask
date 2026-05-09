export { PHONE_MASK_CONFIG, providePhoneMask } from './config';
export { PhoneInputComponent } from './phone-input/phone-input.component';
export { PhoneMaskDirective } from './phone-mask.directive';
export { PhoneMaskPipe } from './phone-mask.pipe';
export { PhoneMaskService } from './phone-mask.service';

export type {
  PhoneInputRef,
  PhoneMaskConfig,
  PhoneMaskDirectiveInput,
  PhoneMaskDirectiveOptions,
  PhoneMaskFormatMode,
  PhoneMaskFormatOptions,
  PhoneMaskState,
  PhoneNumber as PMaskPhoneNumber,
  Size as PhoneInputSize,
  Theme as PhoneInputTheme
} from './types';

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
