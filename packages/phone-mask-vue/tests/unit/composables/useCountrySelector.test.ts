/// <reference types="vitest/globals" />
import { nextTick, ref, shallowRef, toValue } from 'vue';
import { useCountrySelector } from '../../../src/composables/internal/useCountrySelector';
import { testUseCountrySelector, type SetupOptions } from '@common/tests/unit/useCountrySelector';
import { tools, withSetup } from '../setup/tools';
import { createRect } from '@common/tests/unit/setup/domRect';

function setup(options: SetupOptions = {}) {
  const { countryOption, inactive } = options;

  const rootRef = shallowRef<HTMLDivElement | null>(null);
  const dropdownRef = shallowRef<HTMLDivElement | null>(null);
  const selectorRef = shallowRef<HTMLDivElement | null>(null);

  const searchEl = document.createElement('input');
  const searchRef = shallowRef<HTMLInputElement | null>(searchEl);
  vi.spyOn(searchEl, 'focus').mockImplementation(() => {});

  const onSelectCountry = vi.fn();
  const onAfterSelect = vi.fn();

  const { result, unmount } = withSetup(() =>
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

  return {
    result,
    simulateCloseComplete: () => {}, // Vue closes immediately — no animation to complete
    unmount,
    onSelectCountry,
    onAfterSelect,
    searchEl
  };
}

testUseCountrySelector(setup, tools);

function setupWithDom(initialCountryOption?: string) {
  const countryOption = ref<string | undefined>(initialCountryOption);

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
  vi.spyOn(searchEl, 'focus').mockImplementation(() => {});

  const rootRef = shallowRef(rootEl);
  const dropdownRef = shallowRef(dropdownEl);
  const searchRef = shallowRef(searchEl);
  const selectorRef = shallowRef(document.createElement('div'));

  const { result, unmount } = withSetup(() =>
    useCountrySelector({
      rootRef,
      dropdownRef,
      searchRef,
      selectorRef,
      locale: 'en',
      countryOption,
      onSelectCountry: vi.fn()
    })
  );

  return {
    result,
    unmount,
    countryOption,
    list,
    rootRectSpy,
    listRectSpy,
    optionARectSpy,
    optionBRectSpy,
    scrollToSpy
  };
}

describe('useCountrySelector DOM behavior (Vue)', () => {
  it('scrolls focused option into view when navigating down', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.openDropdown();
    });

    await tools.act(async () => {
      ctx.result.handleSearchKeydown({ key: 'ArrowDown', preventDefault: vi.fn() } as unknown as KeyboardEvent);
    });
    await nextTick();

    expect(ctx.scrollToSpy).toHaveBeenCalledWith({ top: 24, behavior: 'smooth' });
    ctx.unmount();
  });

  it('ignores scroll reposition events coming from inside dropdown', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.openDropdown();
    });
    expect(toValue(ctx.result.dropdownStyle).top).toBe('38px');

    ctx.rootRectSpy.mockReturnValue(createRect(100, 140, 5, 200));

    await tools.act(async () => {
      ctx.list.dispatchEvent(new Event('scroll'));
    });
    await nextTick();

    // Style should remain unchanged because internal scroll events are ignored.
    expect(toValue(ctx.result.dropdownStyle).top).toBe('38px');
    expect(toValue(ctx.result.dropdownStyle).width).toBe('120px');
    ctx.unmount();
  });

  it('closes dropdown when countryOption becomes fixed while open', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.openDropdown();
    });
    expect(toValue(ctx.result.dropdownOpen)).toBe(true);

    await tools.act(async () => {
      ctx.countryOption.value = 'US';
    });
    await nextTick();

    expect(toValue(ctx.result.dropdownOpen)).toBe(false);
    ctx.unmount();
  });
});
