/// <reference types="vitest/globals" />
import type { Mock } from 'vitest';

import { createRect } from './domRect';
import { attachLightDismiss } from './popover';

type RectSpy = { mockReturnValue: (value: DOMRect) => unknown };

export interface CountrySelectorDomFixture {
  rootEl: HTMLDivElement;
  dropdownEl: HTMLDivElement;
  list: HTMLUListElement;
  searchEl: HTMLInputElement;
  selectorEl: HTMLButtonElement;
  rootRectSpy: RectSpy;
  listRectSpy: RectSpy;
  optionARectSpy: RectSpy;
  optionBRectSpy: RectSpy;
  scrollToSpy: Mock;
  searchFocusSpy: Mock;
  cleanup: () => void;
}

export interface CountrySelectorDomFixtureFields {
  list: HTMLUListElement;
  rootRectSpy: RectSpy;
  listRectSpy: RectSpy;
  optionARectSpy: RectSpy;
  optionBRectSpy: RectSpy;
  scrollToSpy: Mock;
  searchFocusSpy: Mock;
  dropdownTarget: HTMLDivElement;
  selectorTarget: HTMLButtonElement;
}

export function createCountrySelectorDomFixture(): CountrySelectorDomFixture {
  const rootEl = document.createElement('div');
  const rootRectSpy = vi.spyOn(rootEl, 'getBoundingClientRect').mockReturnValue(createRect(10, 30, 5, 120));

  const dropdownEl = document.createElement('div');
  const list = document.createElement('ul');
  list.className = 'pi-options';
  const optionA = document.createElement('li');
  const optionB = document.createElement('li');
  list.append(optionA, optionB);
  dropdownEl.append(document.createElement('div'), list);

  const listRectSpy = vi.spyOn(list, 'getBoundingClientRect').mockReturnValue(createRect(0, 20));
  const optionARectSpy = vi.spyOn(optionA, 'getBoundingClientRect').mockReturnValue(createRect(0, 10));
  const optionBRectSpy = vi.spyOn(optionB, 'getBoundingClientRect').mockReturnValue(createRect(24, 44));
  const scrollToSpy = vi.fn() as Mock;
  Object.defineProperty(list, 'scrollTo', {
    value: scrollToSpy,
    configurable: true
  });

  const searchEl = document.createElement('input');
  const searchFocusSpy = vi.spyOn(searchEl, 'focus').mockImplementation(() => {}) as Mock;
  const selectorEl = document.createElement('button');

  document.body.append(rootEl, dropdownEl, selectorEl);
  const cleanupLightDismiss = attachLightDismiss(dropdownEl, selectorEl);

  return {
    rootEl,
    dropdownEl,
    list,
    searchEl,
    selectorEl,
    rootRectSpy,
    listRectSpy,
    optionARectSpy,
    optionBRectSpy,
    scrollToSpy,
    searchFocusSpy,
    cleanup: () => {
      cleanupLightDismiss();
      rootEl.remove();
      dropdownEl.remove();
      selectorEl.remove();
    }
  };
}

export function getCountrySelectorDomFixtureFields(dom: CountrySelectorDomFixture): CountrySelectorDomFixtureFields {
  return {
    list: dom.list,
    rootRectSpy: dom.rootRectSpy,
    listRectSpy: dom.listRectSpy,
    optionARectSpy: dom.optionARectSpy,
    optionBRectSpy: dom.optionBRectSpy,
    scrollToSpy: dom.scrollToSpy,
    searchFocusSpy: dom.searchFocusSpy,
    dropdownTarget: dom.dropdownEl,
    selectorTarget: dom.selectorEl
  };
}

export function createCountrySelectorDomSetupResult<T extends object>(
  dom: CountrySelectorDomFixture,
  unmount: () => void,
  setupResult: T
): T & CountrySelectorDomFixtureFields & { unmount: () => void } {
  return {
    ...setupResult,
    ...getCountrySelectorDomFixtureFields(dom),
    unmount: () => {
      dom.cleanup();
      unmount();
    }
  };
}
