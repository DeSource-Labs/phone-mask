/// <reference types="vitest/globals" />
import { signal } from '@angular/core';
import { useCountrySelector } from '@src/services/internal/useCountrySelector.service';
import {
  createKeyboardOpenCountrySelectorSetupResult,
  testUseCountrySelector,
  type SetupOptions
} from '@common/tests/unit/useCountrySelector';
import { testUseCountrySelectorDomBehavior } from '@common/tests/unit/useCountrySelectorDom';
import { tools, withSetup, stabilize } from './setup/tools';
import {
  createCountrySelectorDomSetupResult,
  createCountrySelectorDomFixture
} from '@common/tests/unit/setup/countrySelectorDom';

function setup(options: SetupOptions = {}) {
  const { countryOption, inactive } = options;

  const dom = createCountrySelectorDomFixture();
  const rootRef = signal<HTMLDivElement | null>(dom.rootEl);
  const dropdownRef = signal<HTMLDivElement | null>(dom.dropdownEl);
  const searchRef = signal<HTMLInputElement | null>(dom.searchEl);
  const selectorRef = signal<HTMLButtonElement | null>(dom.selectorEl);

  const onCountrySelect = vi.fn();
  const afterSelect = vi.fn();

  const { result: rawResult, unmount } = withSetup(() =>
    useCountrySelector({
      rootRef,
      dropdownRef,
      searchRef,
      selectorRef,
      locale: 'en',
      countryOption,
      inactive,
      onSelectCountry: onCountrySelect,
      onAfterSelect: afterSelect
    })
  );

  const resultSource = rawResult;

  return createKeyboardOpenCountrySelectorSetupResult(
    resultSource,
    dom.cleanup,
    unmount,
    onCountrySelect,
    afterSelect,
    dom.searchEl
  );
}

testUseCountrySelector(setup, tools);

function setupWithDom(initialCountryOption?: string) {
  const countryOption = signal<string | undefined>(initialCountryOption);
  const inactive = signal(false);
  const dom = createCountrySelectorDomFixture();

  const rootRef = signal<HTMLDivElement | null>(dom.rootEl);
  const dropdownRef = signal<HTMLDivElement | null>(dom.dropdownEl);
  const searchRef = signal(dom.searchEl);
  const selectorRef = signal<HTMLButtonElement | null>(dom.selectorEl);

  const { result, unmount } = withSetup(() =>
    useCountrySelector({
      rootRef,
      dropdownRef,
      searchRef,
      selectorRef,
      onSelectCountry: vi.fn(),
      countryOption,
      inactive,
      locale: 'en'
    })
  );

  return createCountrySelectorDomSetupResult(dom, unmount, {
    result,
    countryOption: {
      get value() {
        return countryOption();
      }
    },
    flushAsync: async () => {
      await stabilize();
      await Promise.resolve();
    },
    setCountryOptionFixed: () => {
      countryOption.set('US');
    },
    setInactive: () => {
      inactive.set(true);
    },
    setRootUnavailable: () => {
      rootRef.set(null);
      globalThis.dispatchEvent(new Event('resize'));
    },
    setDropdownUnavailable: () => {
      dropdownRef.set(null);
    },
    setSelectorUnavailable: () => {
      selectorRef.set(null);
    }
  });
}

describe('useCountrySelector DOM behavior (Angular)', () => {
  testUseCountrySelectorDomBehavior(setupWithDom, tools);
});
