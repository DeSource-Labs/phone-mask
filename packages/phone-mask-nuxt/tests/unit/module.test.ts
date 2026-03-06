import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addPluginMock, addImportsMock, addComponentMock, isNuxtMajorVersionMock, createResolverMock } = vi.hoisted(
  () => ({
    addPluginMock: vi.fn(),
    addImportsMock: vi.fn(),
    addComponentMock: vi.fn(),
    isNuxtMajorVersionMock: vi.fn(),
    createResolverMock: vi.fn(() => ({
      resolve: (...parts: string[]) => parts.join('/')
    }))
  })
);

vi.mock('@nuxt/kit', () => ({
  defineNuxtModule: (definition: unknown) => definition,
  createResolver: createResolverMock,
  isNuxtMajorVersion: isNuxtMajorVersionMock,
  addPlugin: addPluginMock,
  addImports: addImportsMock,
  addComponent: addComponentMock
}));

import module from '../../src/module';

type HookCallback = (...args: unknown[]) => unknown;

interface NuxtStub {
  options: {
    build: {
      transpile: string[];
    };
    css: string[];
  };
  hook: ReturnType<typeof vi.fn>;
}

const createNuxtStub = () => {
  const hooks: Record<string, HookCallback> = {};
  const nuxt: NuxtStub = {
    options: {
      build: {
        transpile: []
      },
      css: []
    },
    hook: vi.fn((name: string, callback: HookCallback) => {
      hooks[name] = callback;
    })
  };

  return { nuxt, hooks };
};

const defaultOptions = {
  css: true,
  component: true,
  directive: true,
  helpers: true
};

const normalizePath = (value: string) => value.replaceAll('\\', '/');

describe('module setup contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isNuxtMajorVersionMock.mockReturnValue(false);
  });

  it('exposes expected defaults and compatibility metadata', () => {
    const typedModule = module as {
      meta: { compatibility: { nuxt: string } };
      defaults: Record<string, boolean>;
    };

    expect(module.meta.compatibility.nuxt).toBe('>=3.0.0');
    expect(typedModule.defaults).toEqual(defaultOptions);
  });

  it('registers plugin, imports, component, css and type references by default', async () => {
    const typedModule = module as { setup: (options: typeof defaultOptions, nuxt: NuxtStub) => Promise<void> };
    const { nuxt, hooks } = createNuxtStub();

    await typedModule.setup(defaultOptions, nuxt);

    expect(createResolverMock).toHaveBeenCalledTimes(1);
    expect(nuxt.options.build.transpile).toHaveLength(1);
    expect(normalizePath(nuxt.options.build.transpile[0] ?? '')).toContain('/runtime');
    expect(hooks['prepare:types']).toBeTypeOf('function');
    expect(hooks['modules:done']).toBeTypeOf('function');

    const references: Array<{ types: string }> = [];
    hooks['prepare:types']({ references });
    expect(references).toContainEqual({ types: '@desource/phone-mask-nuxt' });

    hooks['modules:done']();
    expect(addPluginMock).toHaveBeenCalledTimes(1);
    expect(addPluginMock.mock.calls[0]?.[0] ?? '').toMatch(/runtime[\\/]plugin\.phone-mask/);

    expect(addImportsMock).toHaveBeenCalledTimes(1);
    const imports = addImportsMock.mock.calls[0]?.[0] as Array<{ name: string; from: string; type?: boolean }>;
    const importNames = imports.map((entry) => entry.name);
    expect(importNames).toEqual([
      'vPhoneMaskSetCountry',
      'PMaskHelpers',
      'vPhoneMask',
      'PCountryKey',
      'PMaskBase',
      'PMaskBaseMap',
      'PMask',
      'PMaskMap',
      'PMaskWithFlag',
      'PMaskWithFlagMap',
      'PMaskFull',
      'PMaskFullMap',
      'PMaskPhoneNumber'
    ]);
    expect(imports.every((entry) => entry.from.includes('runtime/shared'))).toBe(true);
    const typedImportNames = imports.filter((entry) => entry.type).map((entry) => entry.name);
    expect(typedImportNames).toEqual([
      'PCountryKey',
      'PMaskBase',
      'PMaskBaseMap',
      'PMask',
      'PMaskMap',
      'PMaskWithFlag',
      'PMaskWithFlagMap',
      'PMaskFull',
      'PMaskFullMap',
      'PMaskPhoneNumber'
    ]);

    expect(addComponentMock).toHaveBeenCalledTimes(1);
    expect(addComponentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'PhoneInput',
        mode: 'client',
        filePath: expect.stringMatching(/runtime[\\/]component/)
      })
    );

    expect(nuxt.options.css[0]).toBe('@desource/phone-mask-vue/assets/lib.css');
  });

  it('respects feature flags and skips disabled integrations', async () => {
    const typedModule = module as { setup: (options: typeof defaultOptions, nuxt: NuxtStub) => Promise<void> };
    const { nuxt, hooks } = createNuxtStub();

    await typedModule.setup(
      {
        css: false,
        component: false,
        directive: false,
        helpers: false
      },
      nuxt
    );

    hooks['modules:done']();
    expect(addPluginMock).not.toHaveBeenCalled();
    expect(addImportsMock).not.toHaveBeenCalled();
    expect(addComponentMock).not.toHaveBeenCalled();
    expect(nuxt.options.css).toEqual([]);
  });

  it('does not add directive plugin for Nuxt 2 runtime', async () => {
    const typedModule = module as { setup: (options: typeof defaultOptions, nuxt: NuxtStub) => Promise<void> };
    const { nuxt, hooks } = createNuxtStub();
    isNuxtMajorVersionMock.mockReturnValue(true);

    await typedModule.setup(defaultOptions, nuxt);
    hooks['modules:done']();

    expect(addPluginMock).not.toHaveBeenCalled();
  });
});
