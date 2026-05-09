export { PHONE_MASK_CONFIG, providePhoneMask } from './config';
export { PhoneInputComponent } from './phone-input/phone-input.component';
export { PhoneMaskDirective } from './phone-mask.directive';
export { PhoneMaskPipe } from './phone-mask.pipe';
export { UsePhoneMaskService } from './services/usePhoneMask.service';
export { UseCopyActionService } from './services/internal/useCopyAction.service';
export { UseCountryService } from './services/internal/useCountry.service';
export { UseCountrySelectorService } from './services/internal/useCountrySelector.service';
export { UseFormatterService } from './services/internal/useFormatter.service';
export { UseInputHandlersService } from './services/internal/useInputHandlers.service';
export { UseThemeService } from './services/internal/useTheme.service';
export { UseValidationHintService } from './services/internal/useValidationHint.service';
export { UseClipboardService } from './services/utility/useClipboard.service';
export { UseTimerService } from './services/utility/useTimer.service';

export type {
  DirectiveHTMLInputElement,
  PhoneInputRef,
  PhoneMaskConfig,
  PhoneMaskDirectiveInput,
  PhoneMaskDirectiveOptions,
  PhoneMaskDirectiveState,
  PhoneMaskFormatMode,
  PhoneMaskFormatOptions,
  PhoneMaskState,
  PhoneNumber as PMaskPhoneNumber,
  Size as PhoneInputSize,
  Theme as PhoneInputTheme
} from './types';

export type { UsePhoneMaskOptions } from './services/usePhoneMask.service';

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
