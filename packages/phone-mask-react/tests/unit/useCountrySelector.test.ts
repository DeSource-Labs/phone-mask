/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import { useCountrySelector } from '../../src/hooks/internal/useCountrySelector';
import { testUseCountrySelector, type SetupOptions } from '@common/tests/unit/useCountrySelector';
import { tools } from './setup/tools';

function setup(options: SetupOptions = {}) {
  const { countryOption, inactive } = options;

  const rootRef = { current: document.createElement('div') };
  const dropdownRef = { current: null };
  const selectorRef = { current: null };

  const searchEl = document.createElement('input');
  const searchRef = { current: searchEl };
  vi.spyOn(searchEl, 'focus').mockImplementation(() => {});

  const onSelectCountry = vi.fn();
  const onAfterSelect = vi.fn();

  const { result, unmount } = renderHook(() =>
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

  // Proxy ensures we always read the latest result.current after re-renders
  const resultProxy = new Proxy({} as ReturnType<typeof useCountrySelector>, {
    get(_target, key) {
      return result.current[key as keyof typeof result.current];
    }
  });

  const simulateCloseComplete = () => result.current.handleDropdownAnimationEnd();

  return {
    result: resultProxy,
    simulateCloseComplete,
    unmount,
    onSelectCountry,
    onAfterSelect,
    searchEl
  };
}

testUseCountrySelector(setup, tools);
