/// <reference types="vitest/globals" />
import { useCountrySelector } from '@src/hooks/internal/useCountrySelector';
import { testUseCountrySelector, type SetupOptions } from '@common/tests/unit/useCountrySelector';
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

  const { result, rerender, unmount } = renderHookWithProxy(
    ({ countryOption }: { countryOption?: string }) =>
      useCountrySelector({
        rootRef: { current: rootEl },
        dropdownRef: { current: dropdownEl },
        searchRef: { current: searchEl },
        selectorRef: { current: document.createElement('div') },
        locale: 'en',
        countryOption,
        onSelectCountry: vi.fn()
      }),
    { initialProps: { countryOption: initialCountryOption } }
  );

  return {
    result,
    rerender,
    unmount,
    scrollToSpy,
    listRectSpy,
    optionARectSpy,
    optionBRectSpy
  };
}

describe('useCountrySelector DOM behavior (React)', () => {
  it('scrolls focused option into view when navigating down', async () => {
    vi.useFakeTimers();
    const ctx = setupWithDom();

    try {
      await tools.act(async () => {
        ctx.result.openDropdown();
      });

      await tools.act(async () => {
        ctx.result.handleSearchKeydown({ key: 'ArrowDown', preventDefault: vi.fn() } as never);
      });

      vi.runAllTimers();
      expect(ctx.scrollToSpy).toHaveBeenCalledWith({ top: 24, behavior: 'smooth' });
    } finally {
      ctx.unmount();
      vi.useRealTimers();
    }
  });

  it('scrolls focused option into view when navigating up', async () => {
    vi.useFakeTimers();
    const ctx = setupWithDom();

    try {
      ctx.listRectSpy.mockReturnValue(createRect(0, 20));
      ctx.optionARectSpy.mockReturnValue(createRect(-10, 0));
      ctx.optionBRectSpy.mockReturnValue(createRect(24, 44));

      await tools.act(async () => {
        ctx.result.openDropdown();
        ctx.result.setFocusedIndex(1);
      });

      await tools.act(async () => {
        ctx.result.handleSearchKeydown({ key: 'ArrowUp', preventDefault: vi.fn() } as never);
      });

      vi.runAllTimers();
      expect(ctx.scrollToSpy).toHaveBeenCalledWith({ top: -10, behavior: 'smooth' });
    } finally {
      ctx.unmount();
      vi.useRealTimers();
    }
  });

  it('starts closing when countryOption becomes fixed while dropdown is open', async () => {
    const ctx = setupWithDom();

    await tools.act(async () => {
      ctx.result.openDropdown();
    });
    expect(ctx.result.dropdownOpen).toBe(true);

    await tools.act(async () => {
      ctx.rerender({ countryOption: 'US' });
    });

    expect(ctx.result.isClosing).toBe(true);

    await tools.act(async () => {
      ctx.result.handleDropdownAnimationEnd();
    });

    expect(ctx.result.dropdownOpen).toBe(false);
    expect(ctx.result.isClosing).toBe(false);
    ctx.unmount();
  });
});
