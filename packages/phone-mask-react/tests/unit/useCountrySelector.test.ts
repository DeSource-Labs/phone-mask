/// <reference types="vitest/globals" />
import { useCountrySelector } from '../../src/hooks/internal/useCountrySelector';
import { testUseCountrySelector, type SetupOptions } from '@common/tests/unit/useCountrySelector';
import { tools, renderHookWithProxy } from './setup/tools';

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

  const { result, unmount } = renderHookWithProxy(() =>
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

  const simulateCloseComplete = () => result.handleDropdownAnimationEnd();

  return { result, simulateCloseComplete, unmount, onSelectCountry, onAfterSelect, searchEl };
}

testUseCountrySelector(setup, tools);

describe('isClosing (React)', () => {
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
