import { ref, computed, watchEffect, toValue, onMounted, type MaybeRefOrGetter, type ComputedRef } from 'vue';
import type { CountryKey, MaskFull } from '@desource/phone-mask';
import {
  getNavigatorLang,
  getCountry,
  parseCountryCode,
  detectByGeoIp,
  detectCountryFromLocale
} from '@desource/phone-mask/kit';

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
  /** Preserve explicit edits and apply an optional country detected from pasted text. */
  onEdit: (country?: CountryKey) => void;
  /** Computed locale value */
  locale: ComputedRef<string>;
}

export function useCountry({
  country: countryOption,
  locale: localeOption,
  detect,
  onCountryChange
}: UseCountryOptions = {}): UseCountryReturn {
  const browserLocale = ref('en');
  const locale = computed<string>(() => toValue(localeOption) || browserLocale.value);

  const countryCode = ref<string>(parseCountryCode(toValue(countryOption), 'US'));
  let countryRevision = 0;

  const country = computed<MaskFull>(() => getCountry(countryCode.value, locale.value));

  const setCountry = (code?: string | null): boolean => {
    const parsed = parseCountryCode(code);

    if (parsed) {
      countryRevision++;
      countryCode.value = parsed;
      return true;
    }

    return false;
  };

  const onEdit = (country?: CountryKey) => {
    countryRevision++;
    if (country) setCountry(country);
  };

  const detectCountry = async () => {
    const revision = countryRevision;
    const geoCountry = await detectByGeoIp();
    if (revision !== countryRevision) return;

    if (setCountry(geoCountry)) return;

    const localeCountry = detectCountryFromLocale();

    setCountry(localeCountry);
  };

  // Sync external country prop
  watchEffect(() => {
    const newCountry = toValue(countryOption);
    if (newCountry) {
      setCountry(newCountry);
    }
  });

  onMounted(() => {
    browserLocale.value = getNavigatorLang();

    // Auto-detect country
    watchEffect((onCleanup) => {
      if (toValue(detect) && !toValue(countryOption)) {
        onCleanup(onEdit);
        void detectCountry();
      }
    });

    // Emit onCountryChange
    watchEffect(() => {
      onCountryChange?.(country.value);
    });
  });

  return { country, setCountry, locale, onEdit };
}
