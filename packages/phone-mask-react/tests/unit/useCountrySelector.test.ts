/// <reference types="vitest/globals" />
import { useCountrySelector } from '@src/hooks/internal/useCountrySelector';
import { testUseCountrySelector, type SetupOptions } from '@common/tests/unit/useCountrySelector';
import { testUseCountrySelectorDomBehavior } from '@common/tests/unit/useCountrySelectorDom';
import { tools, renderHookWithProxy } from './setup/tools';
import { createRect } from '@common/tests/unit/setup/domRect';

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

function setupWithDom(initialCountryOption?: string) {
  const rootEl = document.createElement('div');
  vi.spyOn(rootEl, 'getBoundingClientRect').mockReturnValue(createRect(10, 30, 5, 120));

  const dropdownEl = document.createElement('div');
  const list = document.createElement('ul');
  const optionA = document.createElement('li');
  const optionB = document.createElement('li');
  list.append(optionA, optionB);
  dropdownEl.append(document.createElement('div'), list);

  const listRectSpy = vi.spyOn(list, 'getBoundingClientRect').mockReturnValue(createRect(0, 20));
  const optionARectSpy = vi.spyOn(optionA, 'getBoundingClientRect').mockReturnValue(createRect(0, 10));
  const optionBRectSpy = vi.spyOn(optionB, 'getBoundingClientRect').mockReturnValue(createRect(24, 44));

  const scrollToSpy = vi.fn();
  Object.defineProperty(list, 'scrollTo', {
    value: scrollToSpy,
    configurable: true
  });

  const searchEl = document.createElement('input');
  vi.spyOn(searchEl, 'focus').mockImplementation(() => {});
  const selectorEl = document.createElement('div');

  document.body.append(rootEl, dropdownEl, selectorEl);

  const { result, rerender, unmount } = renderHookWithProxy(
    ({ countryOption }: { countryOption?: string }) =>
      useCountrySelector({
        rootRef: { current: rootEl },
        dropdownRef: { current: dropdownEl },
        searchRef: { current: searchEl },
        selectorRef: { current: selectorEl },
        locale: 'en',
        countryOption,
        onSelectCountry: vi.fn()
      }),
    { initialProps: { countryOption: initialCountryOption } }
  );

  return {
    result,
    rerender,
    unmount: () => {
      rootEl.remove();
      dropdownEl.remove();
      selectorEl.remove();
      unmount();
    },
    scrollToSpy,
    listRectSpy,
    optionARectSpy,
    optionBRectSpy,
    dropdownTarget: dropdownEl,
    selectorTarget: selectorEl,
    flushAsync: async () => {
      vi.runAllTimers();
    },
    setCountryOptionFixed: () => {
      rerender({ countryOption: 'US' });
    },
    completeClose: () => {
      result.handleDropdownAnimationEnd();
    }
  };
}

describe('useCountrySelector DOM behavior (React)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  testUseCountrySelectorDomBehavior(setupWithDom, tools);
});
