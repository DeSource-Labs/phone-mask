import { ref, computed, nextTick } from 'vue';
import {
  MasksFull,
  MasksFullMap,
  MasksFullEn,
  MasksFullMapEn,
  hasCountry,
  detectByGeoIp,
  detectCountryFromLocale,
  filterCountries,
  type CountryKey,
  type MaskFull
} from '@desource/phone-mask';
import type { ShallowRef, ComputedRef } from 'vue';

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

  // #region Dropdown
  const filteredCountries = computed(() => filterCountries(countries.value, search.value));

  const selectCountry = (id: string) => {
    selectedId.value = id as CountryKey;
    closeDropdown();
  };

  const toggleDropdown = async (searchRef: Readonly<ShallowRef<HTMLInputElement | null>>) => {
    dropdownOpened.value = !dropdownOpened.value;
    if (!dropdownOpened.value) return;

    await nextTick();
    searchRef.value?.focus({ preventScroll: true });
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

  const selectInitialCountry = (id: CountryKey, emitFn?: () => void) => {
    const previousId = selectedId.value;
    selectedId.value = id;
    if (previousId !== selectedId.value && emitFn) nextTick(emitFn);
  };

  const initCountry = async (predefined?: string, detect?: boolean, emitFn?: () => void) => {
    if (predefined && hasCountry(predefined)) {
      selectInitialCountry(predefined.toUpperCase() as CountryKey, emitFn);
      return;
    }
    if (!detect) return;
    const geo = await detectByGeoIp(hasCountry);
    if (geo) {
      selectInitialCountry(geo as CountryKey, emitFn);
      return;
    }
    const loc = detectCountryFromLocale();
    if (loc && hasCountry(loc)) {
      selectInitialCountry(loc as CountryKey, emitFn);
      return;
    }
  };
  // #endregion

  return {
    countries,
    selectedId,
    selected,
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
