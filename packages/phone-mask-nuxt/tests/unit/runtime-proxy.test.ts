import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('runtime proxies', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('re-exports PhoneInput component as default from runtime/component', async () => {
    const phoneInputMock = Symbol('PhoneInput');
    vi.doMock('@desource/phone-mask-vue', () => ({
      PhoneInput: phoneInputMock
    }));

    const runtimeComponent = await import('../../src/runtime/component');
    expect(runtimeComponent.default).toBe(phoneInputMock);
  });

  it('re-exports shared helper bindings from runtime/shared', async () => {
    const vPhoneMaskSetCountryMock = vi.fn();
    const vPhoneMaskMock = vi.fn();
    const pMaskHelpersMock = { getFlagEmoji: vi.fn() };

    vi.doMock('@desource/phone-mask-vue', () => ({
      vPhoneMaskSetCountry: vPhoneMaskSetCountryMock,
      vPhoneMask: vPhoneMaskMock
    }));
    vi.doMock('@desource/phone-mask-vue/core', () => ({
      ...pMaskHelpersMock
    }));

    const sharedRuntime = await import('../../src/runtime/shared');

    expect(sharedRuntime.vPhoneMaskSetCountry).toBe(vPhoneMaskSetCountryMock);
    expect(sharedRuntime.vPhoneMask).toBe(vPhoneMaskMock);
    expect(sharedRuntime.PMaskHelpers).toEqual(pMaskHelpersMock);
  });
});
