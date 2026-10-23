import { afterNextRender, computed, effect, linkedSignal, signal, untracked } from '@angular/core';
import type { CountryKey, MaskFull } from '@desource/phone-mask';
import {
  detectByGeoIp,
  detectCountryFromLocale,
  getCountry,
  getNavigatorLang,
  parseCountryCode
} from '@desource/phone-mask/kit';
import type { MaybeGetter } from '../../types';
import { readOption } from '../utility/readOption';

export interface UseCountryOptions {
  country?: MaybeGetter<string | undefined>;
  locale?: MaybeGetter<string | undefined>;
  detect?: MaybeGetter<boolean | undefined>;
  onCountryChange?: (country: MaskFull) => void;
}

export function useCountry({
  country: countryOption,
  locale: localeOption,
  detect,
  onCountryChange
}: UseCountryOptions = {}) {
  const browserLocale = signal('en');
  const rendered = signal(false);
  const locale = computed(() => readOption(localeOption) || browserLocale());
  const countryCode = linkedSignal<string, string>({
    source: () => parseCountryCode(readOption(countryOption)),
    computation: (code, previous) => code || previous?.value || 'US'
  });
  const country = computed(() => getCountry(countryCode(), locale()));
  let selection = 0;
  const setCountry = (code?: string | null): boolean => {
    const parsed = parseCountryCode(code);
    if (!parsed) return false;
    selection++;
    countryCode.set(parsed);
    return true;
  };

  const onEdit = (code?: CountryKey) => {
    selection++;
    if (code) setCountry(code);
  };

  afterNextRender(() => {
    browserLocale.set(getNavigatorLang());
    rendered.set(true);
  });

  effect((onCleanup) => {
    if (!rendered() || !readOption(detect) || readOption(countryOption)) return;
    const requestSelection = selection;
    let cancelled = false;
    onCleanup(() => (cancelled = true));
    void detectByGeoIp().then((code) => {
      if (cancelled || requestSelection !== selection || !readOption(detect) || readOption(countryOption)) return;
      if (!setCountry(code)) setCountry(detectCountryFromLocale());
    });
  });

  if (onCountryChange) {
    effect(() => {
      const value = country();
      untracked(() => onCountryChange(value));
    });
  }

  return { country, locale, setCountry, onEdit };
}
