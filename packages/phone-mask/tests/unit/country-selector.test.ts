/// <reference types="vitest/globals" />
import {
  bindCountryDropdownListeners,
  handleCountryButtonKeydown,
  handleCountrySearchKeydown,
  positionCountryDropdown,
  scrollCountryOptionIntoView
} from '@src/country-selector';
import { createRect } from '@common/tests/unit/setup/domRect';

describe('country selector DOM helpers', () => {
  let originalInnerHeight = globalThis.innerHeight;

  beforeEach(() => {
    originalInnerHeight = globalThis.innerHeight;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'innerHeight', {
      value: originalInnerHeight,
      configurable: true
    });
  });

  it('positions the dropdown below the root by default', () => {
    const root = document.createElement('div');
    const dropdown = document.createElement('div');
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(createRect(10, 30, 5, 120));

    positionCountryDropdown(root, dropdown);

    expect(dropdown.style.getPropertyValue('--pi-dd-top')).toBe('38px');
    expect(dropdown.style.getPropertyValue('--pi-dd-left')).toBe('8px');
    expect(dropdown.style.getPropertyValue('--pi-dd-width')).toBe('120px');
    expect(dropdown.style.getPropertyValue('--pi-dd-max-height')).toBe('300px');
    expect(dropdown.dataset.placement).toBe('bottom');
  });

  it('positions the dropdown above when the upper viewport side has more room', () => {
    const root = document.createElement('div');
    const dropdown = document.createElement('div');
    Object.defineProperty(globalThis, 'innerHeight', {
      value: 200,
      configurable: true
    });
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(createRect(150, 180, 5, 120));

    positionCountryDropdown(root, dropdown);

    expect(dropdown.style.getPropertyValue('--pi-dd-top')).toBe('8px');
    expect(dropdown.style.getPropertyValue('--pi-dd-max-height')).toBe('78px');
    expect(dropdown.dataset.placement).toBe('top');
  });

  it('keeps the viewport gap when the dropdown opens below in a compact viewport', () => {
    const root = document.createElement('div');
    const dropdown = document.createElement('div');
    Object.defineProperty(globalThis, 'innerHeight', {
      value: 200,
      configurable: true
    });
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(createRect(10, 30, 5, 120));

    positionCountryDropdown(root, dropdown);

    expect(dropdown.style.getPropertyValue('--pi-dd-top')).toBe('38px');
    expect(dropdown.style.getPropertyValue('--pi-dd-max-height')).toBe('98px');
    expect(dropdown.dataset.placement).toBe('bottom');
  });

  it('scrolls the focused option into the nearest visible area', () => {
    const dropdown = document.createElement('div');
    const list = document.createElement('ul');
    const option = document.createElement('li');
    const scrollIntoView = vi.fn();
    list.className = 'pi-options';
    list.append(option);
    dropdown.append(list);
    Object.defineProperty(option, 'scrollIntoView', { value: scrollIntoView });

    scrollCountryOptionIntoView(dropdown, 0);

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
  });

  it('binds dropdown listeners and removes them on cleanup', () => {
    const dropdown = document.createElement('div');
    const selector = document.createElement('button');
    const closeDropdown = vi.fn();
    const updateDropdownPosition = vi.fn();
    const cleanup = bindCountryDropdownListeners(
      () => dropdown,
      () => selector,
      closeDropdown,
      updateDropdownPosition
    );

    dropdown.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    selector.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    globalThis.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    globalThis.dispatchEvent(new Event('resize'));

    expect(closeDropdown).toHaveBeenCalledOnce();
    expect(updateDropdownPosition).toHaveBeenCalledOnce();

    cleanup();
    globalThis.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));

    expect(closeDropdown).toHaveBeenCalledOnce();
  });

  it('handles escape and page scroll listeners while ignoring dropdown scroll', () => {
    const dropdown = document.createElement('div');
    const dropdownChild = document.createElement('div');
    const selector = document.createElement('button');
    const closeDropdown = vi.fn();
    const updateDropdownPosition = vi.fn();
    const focusSelector = vi.spyOn(selector, 'focus');
    dropdown.append(dropdownChild);

    const cleanup = bindCountryDropdownListeners(
      () => dropdown,
      () => selector,
      closeDropdown,
      updateDropdownPosition
    );

    dropdownChild.dispatchEvent(new Event('scroll', { bubbles: true }));
    globalThis.dispatchEvent(new Event('scroll'));
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(updateDropdownPosition).toHaveBeenCalledOnce();
    expect(closeDropdown).toHaveBeenCalledOnce();
    expect(focusSelector).toHaveBeenCalledOnce();

    cleanup();
  });
});

describe('country selector keyboard helpers', () => {
  it('moves through search results and selects the focused item', () => {
    const event = { key: 'ArrowDown', preventDefault: vi.fn() };
    const setFocusedIndex = vi.fn();
    const scrollFocusedIntoView = vi.fn();
    const selectItem = vi.fn();

    handleCountrySearchKeydown(
      event,
      0,
      [{ id: 'US' }, { id: 'DE' }],
      setFocusedIndex,
      scrollFocusedIntoView,
      selectItem
    );

    const updateFocusedIndex = setFocusedIndex.mock.calls[0]![0] as (index: number) => number;

    expect(updateFocusedIndex(0)).toBe(1);
    expect(scrollFocusedIntoView).toHaveBeenCalledWith(1);

    handleCountrySearchKeydown(
      { key: 'Enter', preventDefault: vi.fn() },
      1,
      [{ id: 'US' }, { id: 'DE' }],
      setFocusedIndex,
      scrollFocusedIntoView,
      selectItem
    );

    expect(selectItem).toHaveBeenCalledWith({ id: 'DE' });
  });

  it('moves to the previous search result', () => {
    const event = { key: 'ArrowUp', preventDefault: vi.fn() };
    const setFocusedIndex = vi.fn();
    const scrollFocusedIntoView = vi.fn();
    const selectItem = vi.fn();

    handleCountrySearchKeydown(
      event,
      1,
      [{ id: 'US' }, { id: 'DE' }],
      setFocusedIndex,
      scrollFocusedIntoView,
      selectItem
    );

    const updateFocusedIndex = setFocusedIndex.mock.calls[0]![0] as (index: number) => number;

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(updateFocusedIndex(1)).toBe(0);
    expect(scrollFocusedIntoView).toHaveBeenCalledWith(0);
  });

  it('keeps the focused index unchanged when search navigation has no results', () => {
    const arrowDownEvent = { key: 'ArrowDown', preventDefault: vi.fn() };
    const arrowUpEvent = { key: 'ArrowUp', preventDefault: vi.fn() };
    const setFocusedIndex = vi.fn();
    const scrollFocusedIntoView = vi.fn();
    const selectItem = vi.fn();

    handleCountrySearchKeydown(arrowDownEvent, 0, [], setFocusedIndex, scrollFocusedIntoView, selectItem);
    handleCountrySearchKeydown(arrowUpEvent, 0, [], setFocusedIndex, scrollFocusedIntoView, selectItem);

    expect(arrowDownEvent.preventDefault).toHaveBeenCalledOnce();
    expect(arrowUpEvent.preventDefault).toHaveBeenCalledOnce();
    expect(setFocusedIndex).not.toHaveBeenCalled();
    expect(scrollFocusedIntoView).not.toHaveBeenCalled();
  });

  it('tracks pointer and selector keyboard focus intent', () => {
    const event = { key: 'ArrowDown', preventDefault: vi.fn() };
    const setOpenByKeyboard = vi.fn();
    const focusSearch = vi.fn();
    const openDropdown = vi.fn();

    handleCountryButtonKeydown(event, true, setOpenByKeyboard, focusSearch, openDropdown);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(setOpenByKeyboard).toHaveBeenCalledOnce();
    expect(focusSearch).toHaveBeenCalledOnce();
    expect(openDropdown).not.toHaveBeenCalled();
  });

  it('opens the dropdown from selector keyboard activation', () => {
    const setOpenByKeyboard = vi.fn();
    const focusSearch = vi.fn();
    const openDropdown = vi.fn();

    handleCountryButtonKeydown(
      { key: 'Enter', preventDefault: vi.fn() },
      false,
      setOpenByKeyboard,
      focusSearch,
      openDropdown
    );

    expect(setOpenByKeyboard).toHaveBeenCalledOnce();
    expect(focusSearch).not.toHaveBeenCalled();
    expect(openDropdown).not.toHaveBeenCalled();

    handleCountryButtonKeydown(
      { key: 'ArrowDown', preventDefault: vi.fn() },
      false,
      setOpenByKeyboard,
      focusSearch,
      openDropdown
    );

    expect(setOpenByKeyboard).toHaveBeenCalledTimes(2);
    expect(openDropdown).toHaveBeenCalledOnce();
  });
});
