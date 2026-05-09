/// <reference types="vitest/globals" />
import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  createKeyboardOpenCountrySelectorSetupResult,
  testUseCountrySelector,
  type SetupOptions
} from '@common/tests/unit/useCountrySelector';
import { testUseCountrySelectorDomBehavior } from '@common/tests/unit/useCountrySelectorDom';
import {
  createCountrySelectorDomFixture,
  createCountrySelectorDomSetupResult,
  type CountrySelectorDomFixture
} from '@common/tests/unit/setup/countrySelectorDom';
import { UseCountrySelectorService } from '@src/services/internal/useCountrySelector.service';
import { tools } from './setup/tools';

interface CountrySelectorContext {
  dom: CountrySelectorDomFixture;
  countryOption?: string;
  inactive?: boolean;
}

let context: CountrySelectorContext;

@Component({
  standalone: true,
  template: '',
  providers: [UseCountrySelectorService]
})
class UseCountrySelectorHostComponent {
  readonly service = inject(UseCountrySelectorService);
  readonly countryOption = signal<string | undefined>(context.countryOption);
  readonly inactive = signal(context.inactive ?? false);
  readonly rootElement = signal<HTMLDivElement | null>(context.dom.rootEl);
  readonly dropdownElement = signal<HTMLDivElement | null>(context.dom.dropdownEl);
  readonly searchElement = signal<HTMLInputElement | null>(context.dom.searchEl);
  readonly selectorElement = signal<HTMLButtonElement | null>(context.dom.selectorEl);
  readonly onSelectCountry = vi.fn();
  readonly onAfterSelect = vi.fn();

  constructor() {
    this.service.configure({
      rootElement: this.rootElement,
      dropdownElement: this.dropdownElement,
      searchElement: this.searchElement,
      selectorElement: this.selectorElement,
      locale: () => 'en',
      inactive: this.inactive,
      countryOption: this.countryOption,
      onSelectCountry: (code) => this.onSelectCountry(code),
      onAfterSelect: () => this.onAfterSelect()
    });
  }
}

function createHost(options: SetupOptions = {}) {
  context = {
    dom: createCountrySelectorDomFixture(),
    countryOption: options.countryOption,
    inactive: options.inactive
  };

  TestBed.configureTestingModule({ imports: [UseCountrySelectorHostComponent] });
  const fixture = TestBed.createComponent(UseCountrySelectorHostComponent);
  fixture.detectChanges();
  TestBed.tick();

  return {
    fixture,
    host: fixture.componentInstance,
    dom: context.dom
  };
}

function setup(options: SetupOptions = {}) {
  const { fixture, host, dom } = createHost(options);

  return createKeyboardOpenCountrySelectorSetupResult(
    host.service,
    dom.cleanup,
    () => fixture.destroy(),
    host.onSelectCountry,
    host.onAfterSelect,
    dom.searchEl
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

testUseCountrySelector(setup, tools);

function setupWithDom(initialCountryOption?: string) {
  const { fixture, host, dom } = createHost({ countryOption: initialCountryOption });

  return createCountrySelectorDomSetupResult(dom, () => fixture.destroy(), {
    result: host.service,
    flushAsync: async () => {
      TestBed.tick();
      await Promise.resolve();
    },
    setCountryOptionFixed: () => {
      host.countryOption.set('US');
      fixture.detectChanges();
    },
    setInactive: () => {
      host.inactive.set(true);
      fixture.detectChanges();
    },
    setRootUnavailable: () => {
      host.rootElement.set(null);
      fixture.detectChanges();
      globalThis.dispatchEvent(new Event('resize'));
    },
    setDropdownUnavailable: () => {
      host.dropdownElement.set(null);
      fixture.detectChanges();
    },
    setSelectorUnavailable: () => {
      host.selectorElement.set(null);
      fixture.detectChanges();
    }
  });
}

describe('useCountrySelector DOM behavior (Angular)', () => {
  testUseCountrySelectorDomBehavior(setupWithDom, tools);
});
