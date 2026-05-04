/// <reference types="vitest/globals" />
import { useCountrySelector } from '@src/hooks/internal/useCountrySelector';
import { testUseCountrySelector, type SetupOptions } from '@common/tests/unit/useCountrySelector';
import { testUseCountrySelectorDomBehavior } from '@common/tests/unit/useCountrySelectorDom';
import { tools, renderHookWithProxy } from './setup/tools';
import { createRect } from '@common/tests/unit/setup/domRect';
import { attachLightDismiss } from '@common/tests/unit/setup/popover';

type CountrySelectorResult = ReturnType<typeof useCountrySelector>;

function setup(options: SetupOptions = {}) {
  const { countryOption, inactive } = options;

  const rootEl = document.createElement('div');
  const rootRef = { current: rootEl };
  const dropdownEl = document.createElement('div');
  const dropdownRef = { current: dropdownEl };
  const selectorEl = document.createElement('button');
  const selectorRef = { current: selectorEl };

  const searchEl = document.createElement('input');
  const searchRef = { current: searchEl };
  vi.spyOn(searchEl, 'focus').mockImplementation(() => {});

  const onSelectCountry = vi.fn();
  const onAfterSelect = vi.fn();

  document.body.append(rootEl, dropdownEl, selectorEl);
  const cleanupLightDismiss = attachLightDismiss(dropdownEl, selectorEl);

  const hook = renderHookWithProxy(() =>
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

  const result = new Proxy(hook.result as CountrySelectorResult, {
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
      hook.unmount();
    },
    onSelectCountry,
    onAfterSelect,
    searchEl
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

testUseCountrySelector(setup, tools);

function setupWithDom(initialCountryOption?: string, initialInactive = false) {
  const rootEl = document.createElement('div');
  const rootRectSpy = vi.spyOn(rootEl, 'getBoundingClientRect').mockReturnValue(createRect(10, 30, 5, 120));
  const rootRef: { current: HTMLDivElement | null } = { current: rootEl };
  const dropdownEl = document.createElement('div');
  const dropdownRef = { current: dropdownEl };
  const list = document.createElement('ul');
  list.className = 'pi-options';
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
  const searchRef = { current: searchEl };
  const selectorEl = document.createElement('button');
  const selectorRef = { current: selectorEl };
  const onSelectCountry = vi.fn();

  document.body.append(rootEl, dropdownEl, selectorEl);
  const cleanupLightDismiss = attachLightDismiss(dropdownEl, selectorEl);

  const { result, rerender, unmount } = renderHookWithProxy(
    ({ countryOption, inactive }: { countryOption?: string; inactive?: boolean }) =>
      useCountrySelector({
        rootRef,
        dropdownRef,
        searchRef,
        selectorRef,
        locale: 'en',
        countryOption,
        inactive,
        onSelectCountry
      }),
    { initialProps: { countryOption: initialCountryOption, inactive: initialInactive } }
  );

  return {
    result,
    rerender,
    unmount: () => {
      cleanupLightDismiss();
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
    searchFocusSpy,
    searchEl,
    list,
    rootRef,
    dropdownTarget: dropdownEl,
    selectorTarget: selectorEl,
    flushAsync: async () => {
      vi.runAllTimers();
    },
    setCountryOptionFixed: () => {
      rerender({ countryOption: 'US', inactive: initialInactive });
    },
    setInactive: () => {
      rerender({ countryOption: initialCountryOption, inactive: true });
    },
    setRootUnavailable: () => {
      rootRef.current = null;
      globalThis.dispatchEvent(new Event('resize'));
    },
    setDropdownUnavailable: () => {
      dropdownRef.current = null;
    },
    setSelectorUnavailable: () => {
      selectorRef.current = null;
    }
  };
}

describe('useCountrySelector DOM behavior (React)', () => {
  let originalInnerHeight = globalThis.innerHeight;

  beforeEach(() => {
    vi.useFakeTimers();
    originalInnerHeight = globalThis.innerHeight;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'innerHeight', {
      value: originalInnerHeight,
      configurable: true
    });
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  testUseCountrySelectorDomBehavior(setupWithDom, tools);
});
