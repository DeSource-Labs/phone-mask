import { ref, computed, nextTick } from 'vue';
import {
  MasksFull,
  MasksFullMap,
  MasksFullEn,
  MasksFullMapEn,
  type CountryKey,
  type MaskFull
} from '@desource/phone-mask';
import type { ShallowRef, ComputedRef } from 'vue';

import { CACHE_EXPIRY_MS, CACHE_KEY, GEO_IP_TIMEOUT, GEO_IP_URL } from '../consts';
import type { PMaskGeoCache } from '../types';

const emptyCountry: MaskFull = { id: '' as CountryKey, code: '', mask: '', flag: '', name: '' };

export function useCountrySelector(usedLocale: ComputedRef<string>) {
  const isEnLocale = computed(() => usedLocale.value.toLowerCase().startsWith('en'));
  const countries = computed(() => (isEnLocale.value ? MasksFullEn : MasksFull(usedLocale.value)));
  const countriesMap = computed(() => (isEnLocale.value ? MasksFullMapEn : MasksFullMap(usedLocale.value)));

  const selectedId = ref(countries.value[0]?.id || '');
  const dropdownOpened = ref(false);
  const hasDropdown = ref(true);
  const search = ref('');
  const focusedIndex = ref(0);

  const selected = computed(() => {
    const id = selectedId.value as CountryKey;
    const found = countriesMap.value[id];
    return found ? { id, ...found } : countries.value[0] || emptyCountry;
  });

  const hasCountry = (id: string) => {
    const _id = id.toUpperCase() as CountryKey;
    return !!countriesMap.value[_id];
  };

  // #region Dropdown
  const filteredCountries = computed(() => {
    const q = search.value.trim().toUpperCase();
    if (!q) return countries.value;

    const qCodeDigits = q.replace(/\D/g, '');
    const isNumericSearch = qCodeDigits.length > 0;

    return countries.value
      .map((c) => {
        const nameUpper = c.name.toUpperCase();
        const idUpper = c.id.toUpperCase();
        const codeDigits = c.code.replace(/\D/g, '');

        // Calculate relevance score
        let score = 0;
        if (nameUpper.startsWith(q)) score = 1000;
        else if (nameUpper.includes(q)) score = 500;

        if (c.code.startsWith(q)) score += 100;
        else if (c.code.includes(q)) score += 50;

        if (idUpper === q) score += 200;
        else if (idUpper.startsWith(q)) score += 150;

        if (isNumericSearch && codeDigits.startsWith(qCodeDigits)) score += 80;
        else if (isNumericSearch && codeDigits.includes(qCodeDigits)) score += 40;

        return { country: c, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.country.name.localeCompare(b.country.name);
      })
      .map(({ country }) => country);
  });

  const selectCountry = (id: string) => {
    selectedId.value = id as CountryKey;
    closeDropdown();
  };

  const toggleDropdown = async (searchRef: Readonly<ShallowRef<HTMLInputElement | null>>) => {
    dropdownOpened.value = !dropdownOpened.value;
    if (!dropdownOpened.value) return;

    await nextTick();
    searchRef.value?.focus();
    focusedIndex.value = 0;
  };

  const closeDropdown = () => {
    dropdownOpened.value = false;
  };

  const focusNextOption = (scrollFn?: () => void) => {
    if (filteredCountries.value.length === 0) return;
    focusedIndex.value = Math.min(filteredCountries.value.length - 1, focusedIndex.value + 1);
    scrollFn?.();
  };

  const focusPrevOption = (scrollFn?: () => void) => {
    if (filteredCountries.value.length === 0) return;
    focusedIndex.value = Math.max(0, focusedIndex.value - 1);
    scrollFn?.();
  };

  const chooseFocusedOption = () => {
    const item = filteredCountries.value[focusedIndex.value];
    if (item) selectCountry(item.id);
  };
  // #endregion

  // #region Country Detection
  const detectFromLocale = () => {
    try {
      const lang = navigator.language || '';
      try {
        const loc = new Intl.Locale(lang);
        if (loc.region && hasCountry(loc.region)) return loc.region.toUpperCase() as CountryKey;
      } catch {
        // ignore
      }
      const parts = lang.split(/[-_]/);
      if (parts.length > 1 && hasCountry(parts[1])) return parts[1].toUpperCase() as CountryKey;
    } catch {
      // ignore
    }
    return null;
  };

  const detectByGeoIp = async (): Promise<CountryKey | null> => {
    // Check cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: PMaskGeoCache = JSON.parse(cached);
        const isExpired = Date.now() - parsed.ts > CACHE_EXPIRY_MS;

        if (!isExpired && parsed.country_code && hasCountry(parsed.country_code)) {
          return parsed.country_code.toUpperCase() as CountryKey;
        }
        // Remove expired cache
        if (isExpired) {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch {
      // Silent fail for localStorage issues
    }

    // Fetch from GeoIP API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEO_IP_TIMEOUT);

    try {
      const res = await fetch(GEO_IP_URL, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });

      if (!res.ok) {
        return null;
      }

      const json = await res.json();
      const code = (json.country || json.country_code || json.countryCode || json.country_code2 || '')
        .toString()
        .toUpperCase();

      if (code && hasCountry(code)) {
        // Cache the result
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ country_code: code, ts: Date.now() } as PMaskGeoCache));
        } catch {
          // Silent fail for localStorage issues
        }
        return code as CountryKey;
      }
    } catch {
      // ignore
    } finally {
      clearTimeout(timeoutId);
    }

    return null;
  };

  const selectInitialCountry = (id: CountryKey, emitFn?: () => void) => {
    const previousId = selectedId.value;
    selectedId.value = id;
    if (previousId !== selectedId.value && emitFn) nextTick(emitFn);
  };

  const initCountry = async (predefined?: string, detect?: boolean, emitFn?: () => void) => {
    hasDropdown.value = !predefined && countries.value.length > 1;
    if (predefined && hasCountry(predefined)) {
      selectInitialCountry(predefined.toUpperCase() as CountryKey, emitFn);
      return;
    }
    if (!detect) return;
    const geo = await detectByGeoIp();
    if (geo) {
      selectInitialCountry(geo, emitFn);
      return;
    }
    const loc = detectFromLocale();
    if (loc) {
      selectInitialCountry(loc, emitFn);
      return;
    }
  };
  // #endregion

  return {
    countries,
    selectedId,
    selected,
    hasCountry,
    // Dropdown
    hasDropdown,
    dropdownOpened,
    search,
    focusedIndex,
    filteredCountries,
    selectCountry,
    toggleDropdown,
    closeDropdown,
    focusNextOption,
    focusPrevOption,
    chooseFocusedOption,
    // Country Detection
    initCountry
  };
}
