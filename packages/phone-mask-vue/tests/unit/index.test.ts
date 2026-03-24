/// <reference types="vitest/globals" />
import phoneMaskVue, { PhoneInput, PMaskHelpers, install, usePhoneMask, vPhoneMask } from '../../src/index';

describe('vue package index', () => {
  it('exports component, directive, composable and helper facade', () => {
    expect(PhoneInput).toBeDefined();
    expect(vPhoneMask).toBeDefined();
    expect(typeof usePhoneMask).toBe('function');

    expect(typeof PMaskHelpers.getFlagEmoji).toBe('function');
    expect(typeof PMaskHelpers.countPlaceholders).toBe('function');
    expect(typeof PMaskHelpers.formatDigitsWithMap).toBe('function');
    expect(typeof PMaskHelpers.pickMaskVariant).toBe('function');
    expect(typeof PMaskHelpers.removeCountryCodePrefix).toBe('function');
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
