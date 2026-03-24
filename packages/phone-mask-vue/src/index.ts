import {
  getFlagEmoji,
  countPlaceholders,
  formatDigitsWithMap,
  pickMaskVariant,
  removeCountryCodePrefix
} from '@desource/phone-mask';
import type { App } from 'vue';
import PhoneInput from './components/PhoneInput.vue';
import { vPhoneMask as phoneMaskDirective, setCountry as setPhoneMaskCountry } from './directives/vPhoneMask';

type TPhoneInputComponent = typeof PhoneInput;
type TPhoneMaskDirective = typeof phoneMaskDirective;
type TPhoneMaskSetCountryType = typeof setPhoneMaskCountry;

function install(app: App): void {
  app.component('PhoneInput', PhoneInput);
  app.directive('phone-mask', phoneMaskDirective);
}

export { PhoneInput, install, type TPhoneInputComponent, type TPhoneMaskDirective, type TPhoneMaskSetCountryType };

export { vPhoneMask, setCountry as vPhoneMaskSetCountry } from './directives/vPhoneMask';

export { usePhoneMask } from './composables/usePhoneMask';

export type {
  PhoneNumber as PMaskPhoneNumber,
  Size as PhoneInputSize,
  Theme as PhoneInputTheme,
  UsePhoneMaskOptions,
  UsePhoneMaskReturn
} from './types';

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
  removeCountryCodePrefix
};
