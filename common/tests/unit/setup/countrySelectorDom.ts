/// <reference types="vitest/globals" />
import type { Mock } from 'vitest';

import { createRect } from './domRect';

type RectSpy = { mockReturnValue: (value: DOMRect) => unknown };

export interface CountrySelectorDomFixture {
  rootEl: HTMLDivElement;
  dropdownEl: HTMLDivElement;
  list: HTMLUListElement;
  searchEl: HTMLInputElement;
  selectorEl: HTMLButtonElement;
  rootRectSpy: RectSpy;
  optionAScrollIntoViewSpy: Mock;
  optionBScrollIntoViewSpy: Mock;
  searchFocusSpy: Mock;
  cleanup: () => void;
}

export interface CountrySelectorDomFixtureFields {
  list: HTMLUListElement;
  rootRectSpy: RectSpy;
  optionAScrollIntoViewSpy: Mock;
  optionBScrollIntoViewSpy: Mock;
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

  const optionAScrollIntoViewSpy = vi.fn() as Mock;
  const optionBScrollIntoViewSpy = vi.fn() as Mock;
  Object.defineProperty(optionA, 'scrollIntoView', {
    value: optionAScrollIntoViewSpy,
    configurable: true
  });
  Object.defineProperty(optionB, 'scrollIntoView', {
    value: optionBScrollIntoViewSpy,
    configurable: true
  });

  const searchEl = document.createElement('input');
  const searchFocusSpy = vi.spyOn(searchEl, 'focus').mockImplementation(() => {}) as Mock;
  const selectorEl = document.createElement('button');

  document.body.append(rootEl, dropdownEl, selectorEl);

  return {
    rootEl,
    dropdownEl,
    list,
    searchEl,
    selectorEl,
    rootRectSpy,
    optionAScrollIntoViewSpy,
    optionBScrollIntoViewSpy,
    searchFocusSpy,
    cleanup: () => {
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
    optionAScrollIntoViewSpy: dom.optionAScrollIntoViewSpy,
    optionBScrollIntoViewSpy: dom.optionBScrollIntoViewSpy,
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
