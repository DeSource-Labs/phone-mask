import { computed, effect, untracked } from '@angular/core';
import type { MaskFull } from '@desource/phone-mask';
import { createPhoneFormatter, extractDigits } from '@desource/phone-mask/kit';
import type { MaybeGetter, PhoneNumber } from '../../types';
import { readOption } from '../utility/readOption';

export interface UseFormatterOptions {
  country: MaybeGetter<MaskFull>;
  value: MaybeGetter<string>;
  onChange?: (digits: string) => void;
  onPhoneChange?: (phone: PhoneNumber) => void;
  onValidationChange?: (isComplete: boolean) => void;
}

export function useFormatter({ country, value, onChange, onPhoneChange, onValidationChange }: UseFormatterOptions) {
  const formatter = computed(() => createPhoneFormatter(readOption(country)));
  const digits = computed(() => extractDigits(readOption(value), formatter().getMaxDigits()));
  const displayPlaceholder = computed(() => formatter().getPlaceholder());
  const displayValue = computed(() => formatter().formatDisplay(digits()));
  const full = computed(() => (digits() ? `${readOption(country).code}${digits()}` : ''));
  const fullFormatted = computed(() => (displayValue() ? `${readOption(country).code} ${displayValue()}` : ''));
  const isComplete = computed(() => formatter().isComplete(digits()));
  const isEmpty = computed(() => !digits());
  const shouldShowWarn = computed(() => !isEmpty() && !isComplete());

  if (onChange) {
    effect(() => {
      const normalized = digits();
      if (readOption(value) !== normalized) untracked(() => onChange(normalized));
    });
  }

  if (onPhoneChange) {
    effect(() => {
      const phone = { full: full(), fullFormatted: fullFormatted(), digits: digits() };
      untracked(() => onPhoneChange(phone));
    });
  }

  if (onValidationChange) {
    effect(() => {
      const complete = isComplete();
      untracked(() => onValidationChange(complete));
    });
  }

  return {
    digits,
    formatter,
    displayPlaceholder,
    displayValue,
    full,
    fullFormatted,
    isComplete,
    isEmpty,
    shouldShowWarn
  };
}
