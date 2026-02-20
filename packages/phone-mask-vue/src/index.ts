import {
  getFlagEmoji,
  countPlaceholders,
  formatDigitsWithMap,
  pickMaskVariant,
  removeCountryCodePrefix,
  toArray
} from '@desource/phone-mask';
import type { App } from 'vue';
import PhoneInput from './components/PhoneInput.vue';
import { vPhoneMask, setCountry as vPhoneMaskSetCountry } from './directives/vPhoneMask';
import type { PhoneNumber as PMaskPhoneNumber, Size as PhoneInputSize, Theme as PhoneInputTheme } from './types';

type TPhoneInputComponent = typeof PhoneInput;
type TPhoneMaskDirective = typeof vPhoneMask;
type TPhoneMaskSetCountryType = typeof vPhoneMaskSetCountry;

function install(app: App): void {
  app.component('PhoneInput', PhoneInput);
  app.directive('phone-mask', vPhoneMask);
}

export {
  PhoneInput,
  vPhoneMask,
  install,
  vPhoneMaskSetCountry,
  type TPhoneInputComponent,
  type TPhoneMaskDirective,
  type TPhoneMaskSetCountryType,
  type PMaskPhoneNumber,
  type PhoneInputSize,
  type PhoneInputTheme
};

export default {
  install
};

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
