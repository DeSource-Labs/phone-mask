/// <reference types="vitest/globals" />
import {
  bindCountryDropdownListeners,
  handleCountryButtonKeydown,
  handleCountrySearchKeydown,
  isMousePointer,
  positionCountryDropdown,
  scrollCountryOptionIntoView
} from '../../src/country-selector';
import { createRect } from '../../../../common/tests/unit/setup/domRect';

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

    expect(dropdown.style.getPropertyValue('--pi-dd-max-height')).toBe('86px');
    expect(dropdown.dataset.placement).toBe('top');
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
});

describe('country selector keyboard helpers', () => {
  it('moves through search results and selects the focused item', () => {
    const event = { key: 'ArrowDown', preventDefault: vi.fn() };
    const setFocusedIndex = vi.fn();
    const scrollFocusedIntoView = vi.fn();
    const selectItem = vi.fn();
    const closeDropdown = vi.fn();

    handleCountrySearchKeydown(
      event,
      0,
      [{ id: 'US' }, { id: 'DE' }],
      setFocusedIndex,
      scrollFocusedIntoView,
      selectItem,
      closeDropdown
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
      selectItem,
      closeDropdown
    );

    expect(selectItem).toHaveBeenCalledWith({ id: 'DE' });
  });

  it('tracks pointer and selector keyboard focus intent', () => {
    const event = { key: 'ArrowDown', preventDefault: vi.fn() };
    const setOpenByKeyboard = vi.fn();
    const focusSearch = vi.fn();
    const openDropdown = vi.fn();

    expect(isMousePointer({ pointerType: 'mouse' })).toBe(true);
    expect(isMousePointer({ pointerType: 'touch' })).toBe(false);

    handleCountryButtonKeydown(event, true, setOpenByKeyboard, focusSearch, openDropdown);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(setOpenByKeyboard).toHaveBeenCalledOnce();
    expect(focusSearch).toHaveBeenCalledOnce();
    expect(openDropdown).not.toHaveBeenCalled();
  });
});
