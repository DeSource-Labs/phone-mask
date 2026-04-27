/// <reference types="vitest/globals" />
import { nextTick, ref, shallowRef } from 'vue';
import { useCountrySelector } from '@src/composables/internal/useCountrySelector';
import { testUseCountrySelector, type SetupOptions } from '@common/tests/unit/useCountrySelector';
import { testUseCountrySelectorDomBehavior } from '@common/tests/unit/useCountrySelectorDom';
import { tools, withSetup } from './setup/tools';
import { createRect } from '@common/tests/unit/setup/domRect';
import { attachLightDismiss } from '@common/tests/unit/setup/popover';

type CountrySelectorResult = ReturnType<typeof useCountrySelector>;

function setup(options: SetupOptions = {}) {
  const { countryOption, inactive } = options;

  const rootEl = document.createElement('div');
  const rootRef = shallowRef<HTMLDivElement | null>(rootEl);
  const dropdownEl = document.createElement('div');
  const dropdownRef = shallowRef<HTMLDivElement | null>(dropdownEl);
  const selectorEl = document.createElement('button');
  const selectorRef = shallowRef<HTMLButtonElement | null>(selectorEl);

  const searchEl = document.createElement('input');
  const searchRef = shallowRef<HTMLInputElement | null>(searchEl);
  vi.spyOn(searchEl, 'focus').mockImplementation(() => {});

  const onSelectCountry = vi.fn();
  const onAfterSelect = vi.fn();

  document.body.append(rootEl, dropdownEl, selectorEl);
  const cleanupLightDismiss = attachLightDismiss(dropdownEl, selectorEl);

  const { result: rawResult, unmount } = withSetup(() =>
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
    simulateCloseComplete: () => {}, // Vue closes immediately — no animation to complete
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
  const countryOption = ref<string | undefined>(initialCountryOption);
  const inactive = ref(false);

  const rootEl = document.createElement('div');
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
  const searchFocusSpy = vi.spyOn(searchEl, 'focus').mockImplementation(() => {});
  const selectorEl = document.createElement('button');

  document.body.append(rootEl, dropdownEl, selectorEl);
  const cleanupLightDismiss = attachLightDismiss(dropdownEl, selectorEl);

  const rootRef = shallowRef<HTMLDivElement | null>(rootEl);
  const dropdownRef = shallowRef<HTMLDivElement | null>(dropdownEl);
  const searchRef = shallowRef(searchEl);
  const selectorRef = shallowRef<HTMLButtonElement | null>(selectorEl);

  const { result, unmount } = withSetup(() =>
    useCountrySelector({
      rootRef,
      dropdownRef,
      searchRef,
      selectorRef,
      locale: 'en',
      countryOption,
      inactive,
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
    countryOption,
    list,
    rootRectSpy,
    listRectSpy,
    optionARectSpy,
    optionBRectSpy,
    scrollToSpy,
    searchFocusSpy,
    dropdownTarget: dropdownEl,
    selectorTarget: selectorEl,
    flushAsync: async () => {
      await nextTick();
      await Promise.resolve();
    },
    setCountryOptionFixed: () => {
      countryOption.value = 'US';
    },
    setInactive: () => {
      inactive.value = true;
    },
    setRootUnavailable: () => {
      rootRef.value = null;
      globalThis.dispatchEvent(new Event('resize'));
    },
    setDropdownUnavailable: () => {
      dropdownRef.value = null;
    },
    setSelectorUnavailable: () => {
      selectorRef.value = null;
    }
  };
}

describe('useCountrySelector DOM behavior (Vue)', () => {
  testUseCountrySelectorDomBehavior(setupWithDom, tools);
});
