/// <reference types="vitest/globals" />
import phoneMaskVue, { PhoneInput, install, usePhoneMask, vPhoneMask } from '../../src/index';
import * as core from '../../src/core';

describe('vue package index', () => {
  it('exports component, directive, composable and no root helper facade', async () => {
    expect(PhoneInput).toBeDefined();
    expect(vPhoneMask).toBeDefined();
    expect(typeof usePhoneMask).toBe('function');
  });

  it('re-exports core utilities from dedicated core subpath', () => {
    expect(typeof core.getFlagEmoji).toBe('function');
    expect(typeof core.countPlaceholders).toBe('function');
    expect(typeof core.formatDigitsWithMap).toBe('function');
    expect(typeof core.pickMaskVariant).toBe('function');
    expect(typeof core.removeCountryCodePrefix).toBe('function');
  });

  it('install registers component and directive', () => {
    const app = {
      component: vi.fn(),
      directive: vi.fn()
    };

    install(app as never);

    expect(app.component).toHaveBeenCalledWith('PhoneInput', expect.anything());
    expect(app.directive).toHaveBeenCalledWith('phone-mask', expect.anything());
  });

  it('default export exposes install', () => {
    expect(phoneMaskVue).toBeDefined();
    expect(typeof phoneMaskVue.install).toBe('function');
  });
});
