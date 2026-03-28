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

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

testUseCountrySelector(setup, tools);

function setupWithDom(initialCountryOption?: string) {
  const rootEl = document.createElement('div');
  const rootRectSpy = vi.spyOn(rootEl, 'getBoundingClientRect').mockReturnValue(createRect(10, 30, 5, 120));
  const rootRef: { current: HTMLDivElement | null } = { current: rootEl };

  const dropdownEl = document.createElement('div');
  const dropdownRef = { current: dropdownEl };
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
  const searchRef = { current: searchEl };
  const selectorEl = document.createElement('div');
  const selectorRef = { current: selectorEl };
  const onSelectCountry = vi.fn();

  document.body.append(rootEl, dropdownEl, selectorEl);

  const { result, rerender, unmount } = renderHookWithProxy(
    ({ countryOption }: { countryOption?: string }) =>
      useCountrySelector({
        rootRef,
        dropdownRef,
        searchRef,
        selectorRef,
        locale: 'en',
        countryOption,
        onSelectCountry
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
    rootRectSpy,
    list,
    rootRef,
    dropdownTarget: dropdownEl,
    selectorTarget: selectorEl,
    flushAsync: async () => {
      vi.runAllTimers();
    },
    setCountryOptionFixed: () => {
      rerender({ countryOption: 'US' });
    },
    setRootUnavailable: () => {
      rootRef.current = null;
      globalThis.dispatchEvent(new Event('resize'));
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
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  testUseCountrySelectorDomBehavior(setupWithDom, tools);
});
