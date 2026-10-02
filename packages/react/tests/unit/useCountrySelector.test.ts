/// <reference types="vitest/globals" />
import { useCountrySelector } from '@src/hooks/internal/useCountrySelector';
import {
  createKeyboardOpenCountrySelectorSetupResult,
  testUseCountrySelector,
  type SetupOptions
} from '@common/tests/unit/useCountrySelector';
import { testUseCountrySelectorDomBehavior } from '@common/tests/unit/useCountrySelectorDom';
import { tools, renderHookWithProxy } from './setup/tools';
import {
  createCountrySelectorDomSetupResult,
  createCountrySelectorDomFixture
} from '@common/tests/unit/setup/countrySelectorDom';

function setup(options: SetupOptions = {}) {
  const { countryOption, inactive } = options;

  const dom = createCountrySelectorDomFixture();
  const rootRef = { current: dom.rootEl };
  const dropdownRef = { current: dom.dropdownEl };
  const searchRef = { current: dom.searchEl };
  const selectorRef = { current: dom.selectorEl };

  const onSelectCountry = vi.fn();
  const onAfterSelect = vi.fn();

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

  return createKeyboardOpenCountrySelectorSetupResult(
    hook.result,
    dom.cleanup,
    hook.unmount,
    onSelectCountry,
    onAfterSelect,
    dom.searchEl
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

testUseCountrySelector(setup, tools);

function setupWithDom(initialCountryOption?: string, initialInactive = false) {
  const dom = createCountrySelectorDomFixture();
  const rootRef: { current: HTMLDivElement | null } = { current: dom.rootEl };
  const dropdownRef: { current: HTMLDivElement | null } = { current: dom.dropdownEl };
  const selectorRef: { current: HTMLButtonElement | null } = { current: dom.selectorEl };
  const searchRef = { current: dom.searchEl };
  const onSelectCountry = vi.fn();

  const { result, rerender, unmount } = renderHookWithProxy(
    ({ countryOption, inactive }: { countryOption?: string; inactive?: boolean }) =>
      useCountrySelector({
        rootRef,
        dropdownRef,
        selectorRef,
        searchRef,
        locale: 'en',
        countryOption,
        inactive,
        onSelectCountry
      }),
    { initialProps: { countryOption: initialCountryOption, inactive: initialInactive } }
  );

  return createCountrySelectorDomSetupResult(dom, unmount, {
    result,
    rerender,
    rootRef,
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
  });
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
