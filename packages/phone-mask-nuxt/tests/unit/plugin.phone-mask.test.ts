import { describe, expect, it, vi } from 'vitest';

const { defineNuxtPluginMock, vPhoneMaskMock } = vi.hoisted(() => ({
  defineNuxtPluginMock: vi.fn((plugin: unknown) => plugin),
  vPhoneMaskMock: Symbol('vPhoneMask')
}));

vi.mock('#app', () => ({
  defineNuxtPlugin: defineNuxtPluginMock
}));

vi.mock('@desource/phone-mask-vue', () => ({
  vPhoneMask: vPhoneMaskMock
}));

import plugin from '../../src/runtime/plugin.phone-mask';

describe('runtime plugin', () => {
  it('registers the phone-mask directive on vue app', () => {
    const directive = vi.fn();

    plugin.setup({
      vueApp: {
        directive
      }
    });

    expect(defineNuxtPluginMock).toHaveBeenCalledTimes(1);
    expect(directive).toHaveBeenCalledWith('phone-mask', vPhoneMaskMock);
  });
});
