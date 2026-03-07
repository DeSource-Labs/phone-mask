/// <reference types="vitest/globals" />
import type { Mock } from 'vitest';

import type { MaybeRef, TestTools } from './setup/tools';

export interface SetupOptions {
  countryOption?: string;
  inactive?: boolean;
}

export interface CountrySelectorSetupResult {
  result: {
    dropdownOpen: MaybeRef<boolean>;
    search: MaybeRef<string>;
    focusedIndex: MaybeRef<number>;
    filteredCountries: MaybeRef<Array<{ id: string }>>;
    hasDropdown: MaybeRef<boolean>;
    openDropdown: () => void;
    closeDropdown: () => void;
    toggleDropdown: () => void;

    selectCountry(code: string): void;
    setFocusedIndex: (index: number) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSearchChange: (e: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSearchKeydown: (e: any) => void;
  };
  /**
   * Vue: no-op — close is immediate.
   * React: calls handleDropdownAnimationEnd to complete the close animation.
   * Must be called in a separate act() after closeDropdown/selectCountry/Escape.
   */
  simulateCloseComplete: () => void;
  unmount: () => void;
  onSelectCountry: Mock;
  onAfterSelect: Mock;
  /** HTMLInputElement with a spied focus method, connected to the composable's searchRef. */
  searchEl: HTMLInputElement;
}

export type SetupFn = (options?: SetupOptions) => CountrySelectorSetupResult;

export function testUseCountrySelector(setup: SetupFn, { act, toValue }: TestTools): void {
  describe('useCountrySelector', () => {
    describe('initial state', () => {
      it('dropdownOpen is false', () => {
        const { result, unmount } = setup();
        expect(toValue(result.dropdownOpen)).toBe(false);
        unmount();
      });

      it('search is empty string', () => {
        const { result, unmount } = setup();
        expect(toValue(result.search)).toBe('');
        unmount();
      });

      it('focusedIndex is 0', () => {
        const { result, unmount } = setup();
        expect(toValue(result.focusedIndex)).toBe(0);
        unmount();
      });

      it.each([
        { countryOption: undefined, expected: true },
        { countryOption: 'US', expected: false },
        { countryOption: 'DE', expected: false }
      ])('hasDropdown is $expected when countryOption is $countryOption', ({ countryOption, expected }) => {
        const { result, unmount } = setup({ countryOption });
        expect(toValue(result.hasDropdown)).toBe(expected);
        unmount();
      });
    });

    describe('openDropdown', () => {
      it('sets dropdownOpen to true', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.openDropdown();
        });

        expect(toValue(result.dropdownOpen)).toBe(true);
        unmount();
      });

      it('resets focusedIndex to 0', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.setFocusedIndex(3);
        });

        await act(async () => {
          result.openDropdown();
        });

        expect(toValue(result.focusedIndex)).toBe(0);
        unmount();
      });

      it('focuses the search input', async () => {
        vi.useFakeTimers();
        try {
          const { result, searchEl, unmount } = setup();

          await act(async () => {
            result.openDropdown();
            vi.runAllTimers();
          });

          expect(searchEl.focus).toHaveBeenCalledOnce();
          unmount();
        } finally {
          vi.useRealTimers();
        }
      });
    });

    describe('closeDropdown', () => {
      it('closes the dropdown', async () => {
        const { result, simulateCloseComplete, unmount } = setup();

        await act(async () => {
          result.openDropdown();
        });

        expect(toValue(result.dropdownOpen)).toBe(true);

        await act(async () => {
          result.closeDropdown();
        });

        await act(async () => {
          simulateCloseComplete();
        });

        expect(toValue(result.dropdownOpen)).toBe(false);
        unmount();
      });
    });

    describe('toggleDropdown', () => {
      it('opens the dropdown when it is closed', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.toggleDropdown();
        });

        expect(toValue(result.dropdownOpen)).toBe(true);
        unmount();
      });

      it('closes the dropdown when it is open', async () => {
        const { result, simulateCloseComplete, unmount } = setup();

        await act(async () => {
          result.toggleDropdown();
        });

        expect(toValue(result.dropdownOpen)).toBe(true);

        await act(async () => {
          result.toggleDropdown();
        });

        await act(async () => {
          simulateCloseComplete();
        });

        expect(toValue(result.dropdownOpen)).toBe(false);
        unmount();
      });

      it('does nothing when inactive', async () => {
        const { result, unmount } = setup({ inactive: true });

        await act(async () => {
          result.toggleDropdown();
        });

        expect(toValue(result.dropdownOpen)).toBe(false);
        unmount();
      });

      it('does nothing when hasDropdown is false', async () => {
        const { result, unmount } = setup({ countryOption: 'US' });

        await act(async () => {
          result.toggleDropdown();
        });

        expect(toValue(result.dropdownOpen)).toBe(false);
        unmount();
      });
    });

    describe('selectCountry', () => {
      it('calls onSelectCountry with the given code', async () => {
        const { result, onSelectCountry, unmount } = setup();

        await act(async () => {
          result.selectCountry('US');
        });

        expect(onSelectCountry).toHaveBeenCalledWith('US');
        unmount();
      });

      it('closes the dropdown', async () => {
        const { result, simulateCloseComplete, unmount } = setup();

        await act(async () => {
          result.openDropdown();
        });

        await act(async () => {
          result.selectCountry('US');
        });

        await act(async () => {
          simulateCloseComplete();
        });

        expect(toValue(result.dropdownOpen)).toBe(false);
        unmount();
      });

      it('resets search to empty string', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.selectCountry('US');
        });

        expect(toValue(result.search)).toBe('');
        unmount();
      });

      it('resets focusedIndex to 0', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.setFocusedIndex(5);
        });

        await act(async () => {
          result.selectCountry('US');
        });

        expect(toValue(result.focusedIndex)).toBe(0);
        unmount();
      });

      it('calls onAfterSelect', async () => {
        const { result, onAfterSelect, unmount } = setup();

        await act(async () => {
          result.selectCountry('US');
        });

        expect(onAfterSelect).toHaveBeenCalledOnce();
        unmount();
      });
    });

    describe('filteredCountries', () => {
      it('returns all countries when search is empty', () => {
        const { result, unmount } = setup();
        const total = toValue(result.filteredCountries).length;
        expect(total).toBeGreaterThan(1);
        unmount();
      });

      it('filters countries matching the search string', async () => {
        const { result, unmount } = setup();
        const total = toValue(result.filteredCountries).length;

        await act(async () => {
          result.handleSearchChange({ target: { value: 'united' } });
        });

        const filtered = toValue(result.filteredCountries).length;
        expect(filtered).toBeGreaterThan(0);
        expect(filtered).toBeLessThan(total);
        unmount();
      });

      it('returns an empty list when search matches nothing', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.handleSearchChange({ target: { value: 'zzzznomatch' } });
        });

        expect(toValue(result.filteredCountries).length).toBe(0);
        unmount();
      });
    });

    describe('click outside', () => {
      it('closes the dropdown when clicking outside', async () => {
        const { result, simulateCloseComplete, unmount } = setup();

        await act(async () => {
          result.openDropdown();
        });

        expect(toValue(result.dropdownOpen)).toBe(true);

        await act(async () => {
          window.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        await act(async () => {
          simulateCloseComplete();
        });

        expect(toValue(result.dropdownOpen)).toBe(false);
        unmount();
      });
    });

    describe('handleSearchChange', () => {
      it('updates search when called', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.handleSearchChange({ target: { value: 'ger' } });
        });

        expect(toValue(result.search)).toBe('ger');
        unmount();
      });

      it('resets focusedIndex to 0 when search changes', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.setFocusedIndex(5);
        });

        await act(async () => {
          result.handleSearchChange({ target: { value: 'fr' } });
        });

        expect(toValue(result.focusedIndex)).toBe(0);
        unmount();
      });
    });

    describe('handleSearchKeydown', () => {
      it('ArrowDown increments focusedIndex', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.handleSearchKeydown({ key: 'ArrowDown', preventDefault: vi.fn() });
        });

        expect(toValue(result.focusedIndex)).toBe(1);
        unmount();
      });

      it('ArrowDown does not exceed filteredCountries.length - 1', async () => {
        const { result, unmount } = setup();

        const total = toValue(result.filteredCountries).length;

        await act(async () => {
          for (let i = 0; i < total + 2; i++) {
            result.handleSearchKeydown({ key: 'ArrowDown', preventDefault: vi.fn() });
          }
        });

        expect(toValue(result.focusedIndex)).toBe(total - 1);
        unmount();
      });

      it('ArrowUp decrements focusedIndex', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.setFocusedIndex(3);
        });

        await act(async () => {
          result.handleSearchKeydown({ key: 'ArrowUp', preventDefault: vi.fn() });
        });

        expect(toValue(result.focusedIndex)).toBe(2);
        unmount();
      });

      it('ArrowUp does not go below 0', async () => {
        const { result, unmount } = setup();

        await act(async () => {
          result.handleSearchKeydown({ key: 'ArrowUp', preventDefault: vi.fn() });
          result.handleSearchKeydown({ key: 'ArrowUp', preventDefault: vi.fn() });
        });

        expect(toValue(result.focusedIndex)).toBe(0);
        unmount();
      });

      it('Enter selects the currently focused country', async () => {
        const { result, onSelectCountry, unmount } = setup();

        const firstCountry = toValue(result.filteredCountries)[0]!;

        await act(async () => {
          result.handleSearchKeydown({ key: 'Enter', preventDefault: vi.fn() });
        });

        expect(onSelectCountry).toHaveBeenCalledWith(firstCountry.id);
        unmount();
      });

      it('Escape closes the dropdown', async () => {
        const { result, simulateCloseComplete, unmount } = setup();

        await act(async () => {
          result.openDropdown();
        });

        await act(async () => {
          result.handleSearchKeydown({ key: 'Escape', preventDefault: vi.fn() });
        });

        await act(async () => {
          simulateCloseComplete();
        });

        expect(toValue(result.dropdownOpen)).toBe(false);
        unmount();
      });
    });
  });
}
