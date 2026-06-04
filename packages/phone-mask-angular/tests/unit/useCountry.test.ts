/// <reference types="vitest/globals" />
import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';
import { testUseCountry, type CountrySetupOptions } from '@common/tests/unit/useCountry';
import { COUNTRY_DETECTION, UseCountryService } from '@src/services/internal/useCountry.service';
import { tools } from './setup/tools';

const countryDetection = {
  detectByGeoIp: vi.fn(),
  detectCountryFromLocale: vi.fn()
};

let initialOptions: CountrySetupOptions = {};

@Component({
  standalone: true,
  template: '',
  providers: [UseCountryService]
})
class UseCountryHostComponent {
  readonly service = inject(UseCountryService);
  readonly countryOption = signal(initialOptions.countryOption);
  readonly locale = signal(initialOptions.locale);
  readonly detect = signal<boolean | undefined>(initialOptions.detect ?? false);
  readonly onCountryChange = vi.fn();

  constructor() {
    this.service.configure({
      country: this.countryOption,
      locale: this.locale,
      detect: this.detect,
      onCountryChange: (country) => this.onCountryChange(country)
    });
  }
}

function setup(options: CountrySetupOptions = {}) {
  initialOptions = options;
  TestBed.configureTestingModule({
    imports: [UseCountryHostComponent],
    providers: [{ provide: COUNTRY_DETECTION, useValue: countryDetection }]
  });
  const fixture = TestBed.createComponent(UseCountryHostComponent);
  fixture.detectChanges();
  TestBed.tick();

  const host = fixture.componentInstance;

  return {
    result: {
      country: host.service.country,
      setCountry: (code?: string | null) => host.service.setCountry(code),
      locale: host.service.locale
    },
    unmount: () => fixture.destroy(),
    rerender: (newProps: Partial<CountrySetupOptions>) => {
      if ('countryOption' in newProps) host.countryOption.set(newProps.countryOption);
      if ('locale' in newProps) host.locale.set(newProps.locale);
      if ('detect' in newProps) host.detect.set(newProps.detect);
      fixture.detectChanges();
    },
    onCountryChange: host.onCountryChange
  };
}

const mocks = {
  detectByGeoIp: countryDetection.detectByGeoIp as Mock,
  detectCountryFromLocale: countryDetection.detectCountryFromLocale as Mock
};

testUseCountry(setup, tools, mocks);

describe('UseCountryService Angular scheduling', () => {
  it('keeps the first configuration when configure is called again', () => {
    TestBed.configureTestingModule({
      providers: [UseCountryService, { provide: COUNTRY_DETECTION, useValue: countryDetection }]
    });

    const service = TestBed.inject(UseCountryService);
    service.configure({ country: () => 'US', detect: () => false });
    service.configure({ country: () => 'GB', detect: () => false });

    expect(service.country().id).toBe('US');
  });

  it('uses detect=true as the service default when no detect option is configured', async () => {
    mocks.detectByGeoIp.mockResolvedValue(null);
    mocks.detectCountryFromLocale.mockReturnValue(null);

    TestBed.configureTestingModule({
      providers: [UseCountryService, { provide: COUNTRY_DETECTION, useValue: countryDetection }]
    });

    const service = TestBed.inject(UseCountryService);
    service.configure();

    await tools.act(async () => {});

    expect(service.detect()).toBe(true);
    expect(mocks.detectByGeoIp).toHaveBeenCalledOnce();
  });

  it('does not repeat detection for the same locale and detect key', async () => {
    mocks.detectByGeoIp.mockResolvedValue(null);
    mocks.detectCountryFromLocale.mockReturnValue(null);

    const { rerender, unmount } = setup({ detect: true, locale: 'en' });

    await tools.act(async () => {});
    expect(mocks.detectByGeoIp).toHaveBeenCalledTimes(1);

    rerender({ locale: 'en' });
    await tools.act(async () => {});
    expect(mocks.detectByGeoIp).toHaveBeenCalledTimes(1);

    rerender({ locale: 'de' });
    await tools.act(async () => {});
    expect(mocks.detectByGeoIp).toHaveBeenCalledTimes(2);

    unmount();
  });
});
