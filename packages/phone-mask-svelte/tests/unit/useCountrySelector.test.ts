/// <reference types="vitest/globals" />
import { useCountrySelector } from '@src/composables/internal/useCountrySelector.svelte';
import { testUseCountrySelector, type SetupOptions } from '@common/tests/unit/useCountrySelector';
import { testUseCountrySelectorDomBehavior } from '@common/tests/unit/useCountrySelectorDom';
import { createState, tools, withSetup } from './setup/tools.svelte';
import { createRect } from '@common/tests/unit/setup/domRect';

function setup(options: SetupOptions = {}) {
  const { countryOption, inactive } = options;
  const countryOptionGetter = countryOption === undefined ? undefined : () => countryOption;
  const inactiveGetter = inactive === undefined ? undefined : () => inactive;

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
      countryOption: countryOptionGetter,
      inactive: inactiveGetter
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

function setupWithDom(initialCountryOption?: string) {
  const countryOptionState = createState<string | undefined>(initialCountryOption);

  const rootEl = document.createElement('div');
  const rootState = createState<HTMLDivElement | null>(rootEl);
  const rootRectSpy = vi.spyOn(rootEl, 'getBoundingClientRect').mockReturnValue(createRect(10, 30, 5, 120));

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

  const { result, unmount } = withSetup(() =>
    useCountrySelector({
      rootRef: () => rootState.value,
      dropdownRef: () => dropdownEl,
      searchRef: () => searchEl,
      selectorRef: () => selectorEl,
      locale: () => 'en',
      countryOption: () => countryOptionState.value,
      onSelectCountry: vi.fn()
    })
  );

  return {
    result,
    unmount: () => {
      rootEl.remove();
      dropdownEl.remove();
      selectorEl.remove();
      unmount();
    },
    countryOptionState,
    scrollToSpy,
    list,
    rootRectSpy,
    listRectSpy,
    optionARectSpy,
    optionBRectSpy,
    dropdownTarget: dropdownEl,
    selectorTarget: selectorEl,
    flushAsync: async () => {
      await Promise.resolve();
      await tools.act(async () => {});
    },
    setCountryOptionFixed: () => {
      countryOptionState.value = 'US';
    },
    setRootUnavailable: () => {
      rootState.value = null;
      globalThis.dispatchEvent(new Event('resize'));
    },
    completeClose: () => {
      result.handleDropdownAnimationEnd();
    }
  };
}

describe('useCountrySelector DOM behavior (Svelte)', () => {
  testUseCountrySelectorDomBehavior(setupWithDom, tools);
});
