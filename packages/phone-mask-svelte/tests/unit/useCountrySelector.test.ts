/// <reference types="vitest/globals" />
import { useCountrySelector } from '../../src/composables/internal/useCountrySelector.svelte';
import { testUseCountrySelector, type SetupOptions } from '@common/tests/unit/useCountrySelector';
import { tools, withSetup } from './setup/tools.svelte';

function setup(options: SetupOptions = {}) {
  const { countryOption, inactive } = options;

  const rootEl = document.createElement('div');
  let dropdownEl: HTMLDivElement | null = null;
  let selectorEl: HTMLDivElement | null = null;

  const searchEl = document.createElement('input');
  vi.spyOn(searchEl, 'focus').mockImplementation(() => {});

  const onSelectCountry = vi.fn();
  const onAfterSelect = vi.fn();

  const { result, unmount } = withSetup(() =>
    useCountrySelector({
      rootRef: () => rootEl,
      dropdownRef: () => dropdownEl,
      searchRef: () => searchEl,
      selectorRef: () => selectorEl,
      locale: () => 'en',
      onSelectCountry,
      onAfterSelect,
      countryOption: countryOption !== undefined ? () => countryOption : undefined,
      inactive: inactive !== undefined ? () => inactive : undefined
    })
  );

  return {
    result,
    simulateCloseComplete: () => result.handleDropdownAnimationEnd(),
    unmount,
    onSelectCountry,
    onAfterSelect,
    searchEl
  };
}

testUseCountrySelector(setup, tools);

describe('isClosing (Svelte)', () => {
  it('isClosing is true after closeDropdown before animation completes', async () => {
    const { result, unmount } = setup();

    await tools.act(async () => {
      result.openDropdown();
    });

    await tools.act(async () => {
      result.closeDropdown();
    });

    expect(result.isClosing).toBe(true);
    expect(result.dropdownOpen).toBe(true);
    unmount();
  });

  it('isClosing is false and dropdownOpen is false after handleDropdownAnimationEnd', async () => {
    const { result, unmount } = setup();

    await tools.act(async () => {
      result.openDropdown();
    });

    await tools.act(async () => {
      result.closeDropdown();
    });

    await tools.act(async () => {
      result.handleDropdownAnimationEnd();
    });

    expect(result.isClosing).toBe(false);
    expect(result.dropdownOpen).toBe(false);
    unmount();
  });
});
