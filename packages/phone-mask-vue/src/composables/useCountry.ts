import { ref, computed, watchEffect, toValue } from 'vue';
import type { MaybeRefOrGetter, ComputedRef } from 'vue';
import {
  getNavigatorLang,
  getCountry,
  parseCountryCode,
  detectByGeoIp,
  detectCountryFromLocale,
  type MaskFull
} from '@desource/phone-mask';

export interface UseCountryOptions {
  /** Country ISO code (e.g., 'US', 'DE', 'GB') */
  country?: MaybeRefOrGetter<string | undefined>;
  /** Locale for country names (default: navigator.language) */
  locale?: MaybeRefOrGetter<string | undefined>;
  /** Auto-detect country from IP/locale (default: false) */
  detect?: MaybeRefOrGetter<boolean | undefined>;
  /** Callback when country changes */
  onCountryChange?: (country: MaskFull) => void;
}

export interface UseCountryReturn {
  /** Current country data */
  country: ComputedRef<MaskFull>;
  /** Change country programmatically */
  setCountry: (countryCode?: string | null) => boolean;
  /** Computed locale value */
  locale: ComputedRef<string>;
}

export function useCountry({
  country: countryOption,
  locale: localeOption,
  detect,
  onCountryChange
}: UseCountryOptions = {}): UseCountryReturn {
  const locale = computed<string>(() => toValue(localeOption) || getNavigatorLang());

  const countryCode = ref<string>(parseCountryCode(toValue(countryOption), 'US'));

  const country = computed<MaskFull>(() => getCountry(countryCode.value, locale.value));

  const setCountry = (code?: string | null): boolean => {
    const parsed = parseCountryCode(code);

    if (parsed) {
      countryCode.value = parsed;
      return true;
    }

    return false;
  };

  const detectCountry = async () => {
    const geoCountry = await detectByGeoIp();

    if (setCountry(geoCountry)) return;

    const localeCountry = detectCountryFromLocale();

    setCountry(localeCountry);
  };

  // Sync external country prop
  watchEffect(() => {
    const newCountry = toValue(countryOption);
    if (newCountry && newCountry !== countryCode.value) {
      setCountry(newCountry);
    }
  });

  // Auto-detect country
  watchEffect(() => {
    if (toValue(detect) && !toValue(countryOption)) {
      detectCountry();
    }
  });

  // Emit onCountryChange
  watchEffect(() => {
    onCountryChange?.(country.value);
  });

  return { country, setCountry, locale };
}
