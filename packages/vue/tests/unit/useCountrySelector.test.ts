/// <reference types="vitest/globals" />
import { nextTick, ref, shallowRef } from 'vue';
import { useCountrySelector } from '@src/composables/internal/useCountrySelector';
import {
  createCountrySelectorSetup,
  testUseCountrySelector,
  type SetupOptions
} from '@common/tests/unit/useCountrySelector';
import { testUseCountrySelectorDomBehavior } from '@common/tests/unit/useCountrySelectorDom';
import { tools, withSetup } from './setup/tools';
import {
  createCountrySelectorDomSetupResult,
  createCountrySelectorDomFixture
} from '@common/tests/unit/setup/countrySelectorDom';

function setup(options: SetupOptions = {}) {
  return createCountrySelectorSetup((dom, callbacks) => {
    const rootRef = shallowRef<HTMLDivElement | null>(dom.rootEl);
    const dropdownRef = shallowRef<HTMLDivElement | null>(dom.dropdownEl);
    const searchRef = shallowRef<HTMLInputElement | null>(dom.searchEl);
    const selectorRef = shallowRef<HTMLButtonElement | null>(dom.selectorEl);

    return withSetup(() =>
      useCountrySelector({
        rootRef,
        dropdownRef,
        searchRef,
        selectorRef,
        locale: 'en',
        ...options,
        ...callbacks
      })
    );
  });
}

testUseCountrySelector(setup, tools);

function setupWithDom(initialCountryOption?: string) {
  const countryOption = ref<string | undefined>(initialCountryOption);
  const inactive = ref(false);
  const dom = createCountrySelectorDomFixture();

  const rootRef = shallowRef<HTMLDivElement | null>(dom.rootEl);
  const dropdownRef = shallowRef<HTMLDivElement | null>(dom.dropdownEl);
  const searchRef = shallowRef(dom.searchEl);
  const selectorRef = shallowRef<HTMLButtonElement | null>(dom.selectorEl);

  const { result, unmount } = withSetup(() =>
    useCountrySelector({
      rootRef,
      dropdownRef,
      searchRef,
      selectorRef,
      onSelectCountry: vi.fn(),
      countryOption,
      inactive,
      locale: 'en'
    })
  );

  return createCountrySelectorDomSetupResult(dom, unmount, {
    result,
    countryOption,
    flushAsync: async () => {
      await nextTick();
      await Promise.resolve();
    },
    setCountryOptionFixed: () => {
      countryOption.value = 'US';
    },
    setInactive: () => {
      inactive.value = true;
    },
    setRootUnavailable: () => {
      rootRef.value = null;
      globalThis.dispatchEvent(new Event('resize'));
    },
    setDropdownUnavailable: () => {
      dropdownRef.value = null;
    },
    setSelectorUnavailable: () => {
      selectorRef.value = null;
    }
  });
}

describe('useCountrySelector DOM behavior (Vue)', () => {
  testUseCountrySelectorDomBehavior(setupWithDom, tools);
});
