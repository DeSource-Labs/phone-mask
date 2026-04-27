/// <reference types="vitest/globals" />
import { useCountrySelector } from '@src/composables/internal/useCountrySelector.svelte';
import { testUseCountrySelector, type SetupOptions } from '@common/tests/unit/useCountrySelector';
import { testUseCountrySelectorDomBehavior } from '@common/tests/unit/useCountrySelectorDom';
import { createState, tools, withSetup } from './setup/tools.svelte';
import { createRect } from '@common/tests/unit/setup/domRect';
import { attachLightDismiss } from '@common/tests/unit/setup/popover';

type CountrySelectorResult = ReturnType<typeof useCountrySelector>;

function setup(options: SetupOptions = {}) {
  const { countryOption, inactive } = options;
  const countryOptionGetter = countryOption === undefined ? undefined : () => countryOption;
  const inactiveGetter = inactive === undefined ? undefined : () => inactive;

  const rootEl = document.createElement('div');
  const dropdownEl = document.createElement('div');
  const selectorEl = document.createElement('button');

  const searchEl = document.createElement('input');
  vi.spyOn(searchEl, 'focus').mockImplementation(() => {});

  const onSelectCountry = vi.fn();
  const onAfterSelect = vi.fn();

  document.body.append(rootEl, dropdownEl, selectorEl);
  const cleanupLightDismiss = attachLightDismiss(dropdownEl, selectorEl);

  const { result: rawResult, unmount } = withSetup(() =>
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

  const result = new Proxy(rawResult as CountrySelectorResult, {
    get(target, key, receiver) {
      if (key === 'openDropdown') {
        return () => {
          target.handleSelectorKeydown({ key: 'Enter' } as never);
          target.openDropdown();
        };
      }

      return Reflect.get(target, key, receiver);
    }
  });

  return {
    result,
    simulateCloseComplete: () => {},
    unmount: () => {
      cleanupLightDismiss();
      rootEl.remove();
      dropdownEl.remove();
      selectorEl.remove();
      unmount();
    },
    onSelectCountry,
    onAfterSelect,
    searchEl
  };
}

testUseCountrySelector(setup, tools);

function setupWithDom(initialCountryOption?: string) {
  const countryOptionState = createState<string | undefined>(initialCountryOption);
  const inactiveState = createState(false);

  const rootEl = document.createElement('div');
  const rootState = createState<HTMLDivElement | null>(rootEl);
  const rootRectSpy = vi.spyOn(rootEl, 'getBoundingClientRect').mockReturnValue(createRect(10, 30, 5, 120));

  const dropdownEl = document.createElement('div');
  const dropdownState = createState<HTMLDivElement | null>(dropdownEl);
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
  const searchFocusSpy = vi.spyOn(searchEl, 'focus').mockImplementation(() => {});
  const selectorEl = document.createElement('button');
  const selectorState = createState<HTMLButtonElement | null>(selectorEl);

  document.body.append(rootEl, dropdownEl, selectorEl);
  const cleanupLightDismiss = attachLightDismiss(dropdownEl, selectorEl);

  const { result, unmount } = withSetup(() =>
    useCountrySelector({
      rootRef: () => rootState.value,
      dropdownRef: () => dropdownState.value,
      searchRef: () => searchEl,
      selectorRef: () => selectorState.value,
      locale: () => 'en',
      countryOption: () => countryOptionState.value,
      inactive: () => inactiveState.value,
      onSelectCountry: vi.fn()
    })
  );

  return {
    result,
    unmount: () => {
      cleanupLightDismiss();
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
    searchFocusSpy,
    dropdownTarget: dropdownEl,
    selectorTarget: selectorEl,
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
  };
}

describe('useCountrySelector DOM behavior (Svelte)', () => {
  testUseCountrySelectorDomBehavior(setupWithDom, tools);
});
