/// <reference types="vitest/globals" />
import { useCountrySelector } from '@src/composables/internal/useCountrySelector.svelte';
import {
  createKeyboardOpenCountrySelectorSetupResult,
  testUseCountrySelector,
  type SetupOptions
} from '@common/tests/unit/useCountrySelector';
import { testUseCountrySelectorDomBehavior } from '@common/tests/unit/useCountrySelectorDom';
import { createState, tools, withSetup } from './setup/tools.svelte';
import {
  createCountrySelectorDomSetupResult,
  createCountrySelectorDomFixture
} from '@common/tests/unit/setup/countrySelectorDom';

function setup(options: SetupOptions = {}) {
  const { countryOption, inactive } = options;
  const countryOptionGetter = countryOption === undefined ? undefined : () => countryOption;
  const inactiveGetter = inactive === undefined ? undefined : () => inactive;

  const dom = createCountrySelectorDomFixture();
  const cleanup = dom.cleanup;
  const onSelectCountry = vi.fn();
  const onAfterSelect = vi.fn();

  const { result: rawResult, unmount } = withSetup(() =>
    useCountrySelector({
      rootRef: () => dom.rootEl,
      dropdownRef: () => dom.dropdownEl,
      searchRef: () => dom.searchEl,
      selectorRef: () => dom.selectorEl,
      locale: () => 'en',
      onSelectCountry,
      onAfterSelect,
      countryOption: countryOptionGetter,
      inactive: inactiveGetter
    })
  );

  return createKeyboardOpenCountrySelectorSetupResult(
    rawResult,
    cleanup,
    unmount,
    onSelectCountry,
    onAfterSelect,
    dom.searchEl
  );
}

testUseCountrySelector(setup, tools);

function setupWithDom(initialCountryOption?: string) {
  const countryOptionState = createState<string | undefined>(initialCountryOption);
  const inactiveState = createState(false);
  const dom = createCountrySelectorDomFixture();

  const rootState = createState<HTMLDivElement | null>(dom.rootEl);
  const dropdownState = createState<HTMLDivElement | null>(dom.dropdownEl);
  const selectorState = createState<HTMLButtonElement | null>(dom.selectorEl);

  const { result, unmount } = withSetup(() =>
    useCountrySelector({
      rootRef: () => rootState.value,
      dropdownRef: () => dropdownState.value,
      searchRef: () => dom.searchEl,
      selectorRef: () => selectorState.value,
      locale: () => 'en',
      countryOption: () => countryOptionState.value,
      inactive: () => inactiveState.value,
      onSelectCountry: vi.fn()
    })
  );

  return createCountrySelectorDomSetupResult(dom, unmount, {
    result,
    countryOptionState,
    flushAsync: async () => {
      await Promise.resolve();
      await tools.act(async () => {});
    },
    setCountryOptionFixed: () => {
      countryOptionState.value = 'US';
    },
    setInactive: () => {
      inactiveState.value = true;
    },
    setRootUnavailable: () => {
      rootState.value = null;
      globalThis.dispatchEvent(new Event('resize'));
    },
    setDropdownUnavailable: () => {
      dropdownState.value = null;
    },
    setSelectorUnavailable: () => {
      selectorState.value = null;
    }
  });
}

describe('useCountrySelector DOM behavior (Svelte)', () => {
  testUseCountrySelectorDomBehavior(setupWithDom, tools);
});
