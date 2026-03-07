/// <reference types="vitest/globals" />
import { useCountrySelector } from '@src/composables/internal/useCountrySelector.svelte';
import { testUseCountrySelector, type SetupOptions } from '@common/tests/unit/useCountrySelector';
import { createState, tools, withSetup } from './setup/tools.svelte';
import { createRect } from '@common/tests/unit/setup/domRect';

function setup(options: SetupOptions = {}) {
  const { countryOption, inactive } = options;

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
      countryOption: countryOption !== undefined ? () => countryOption : undefined,
      inactive: inactive !== undefined ? () => inactive : undefined
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

describe('isClosing (Svelte)', () => {
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
  const countryOptionState = createState<string | undefined>(initialCountryOption);

  const rootEl = document.createElement('div');
  vi.spyOn(rootEl, 'getBoundingClientRect').mockReturnValue(createRect(10, 30, 5, 120));

  const dropdownEl = document.createElement('div');
  const list = document.createElement('ul');
  const optionA = document.createElement('li');
  const optionB = document.createElement('li');
  list.append(optionA, optionB);
  dropdownEl.append(document.createElement('div'), list);

  vi.spyOn(list, 'getBoundingClientRect').mockReturnValue(createRect(0, 20));
  vi.spyOn(optionA, 'getBoundingClientRect').mockReturnValue(createRect(0, 10));
  vi.spyOn(optionB, 'getBoundingClientRect').mockReturnValue(createRect(24, 44));

  const scrollToSpy = vi.fn();
  Object.defineProperty(list, 'scrollTo', {
    value: scrollToSpy,
    configurable: true
  });

  const searchEl = document.createElement('input');
  vi.spyOn(searchEl, 'focus').mockImplementation(() => {});

  const { result, unmount } = withSetup(() =>
    useCountrySelector({
      rootRef: () => rootEl,
      dropdownRef: () => dropdownEl,
      searchRef: () => searchEl,
      selectorRef: () => document.createElement('div'),
      locale: () => 'en',
      countryOption: () => countryOptionState.value,
      onSelectCountry: vi.fn()
    })
  );

  return { result, unmount, countryOptionState, scrollToSpy };
}

describe('useCountrySelector DOM behavior (Svelte)', () => {
  it('scrolls focused option into view when navigating down', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.openDropdown();
    });

    await tools.act(async () => {
      ctx.result.handleSearchKeydown({ key: 'ArrowDown', preventDefault: vi.fn() } as unknown as KeyboardEvent);
    });

    await Promise.resolve();
    await tools.act(async () => {});

    expect(ctx.scrollToSpy).toHaveBeenCalledWith({ top: 24, behavior: 'smooth' });
    ctx.unmount();
  });

  it('starts closing when countryOption becomes fixed while open', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.openDropdown();
    });

    await tools.act(async () => {
      ctx.countryOptionState.value = 'US';
    });

    expect(ctx.result.isClosing).toBe(true);

    await tools.act(async () => {
      ctx.result.handleDropdownAnimationEnd();
    });

    expect(ctx.result.dropdownOpen).toBe(false);
    expect(ctx.result.isClosing).toBe(false);
    ctx.unmount();
  });

  it('ignores animation end when dropdown is not closing', async () => {
    const { result, unmount } = setupWithDom();

    await tools.act(async () => {
      result.handleDropdownAnimationEnd();
    });

    expect(result.dropdownOpen).toBe(false);
    expect(result.isClosing).toBe(false);
    unmount();
  });
});
