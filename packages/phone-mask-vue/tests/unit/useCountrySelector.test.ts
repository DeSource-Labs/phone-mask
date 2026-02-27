/// <reference types="vitest/globals" />
import { shallowRef } from 'vue';
import { useCountrySelector } from '../../src/composables/internal/useCountrySelector';
import { testUseCountrySelector, type SetupOptions } from '@common/tests/unit/useCountrySelector';
import { tools, withSetup } from './setup/tools';

function setup(options: SetupOptions = {}) {
  const { countryOption, inactive } = options;

  const rootRef = shallowRef<HTMLDivElement | null>(null);
  const dropdownRef = shallowRef<HTMLDivElement | null>(null);
  const selectorRef = shallowRef<HTMLDivElement | null>(null);

  const searchEl = document.createElement('input');
  const searchRef = shallowRef<HTMLInputElement | null>(searchEl);
  vi.spyOn(searchEl, 'focus').mockImplementation(() => {});

  const onSelectCountry = vi.fn();
  const onAfterSelect = vi.fn();

  const { result, unmount } = withSetup(() =>
    useCountrySelector({
      rootRef,
      dropdownRef,
      searchRef,
      selectorRef,
      locale: 'en',
      onSelectCountry,
      onAfterSelect,
      countryOption,
      inactive
    })
  );

  return {
    result,
    simulateCloseComplete: () => {}, // Vue closes immediately — no animation to complete
    unmount,
    onSelectCountry,
    onAfterSelect,
    searchEl
  };
}

testUseCountrySelector(setup, tools);
