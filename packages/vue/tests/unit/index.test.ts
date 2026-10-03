/// <reference types="vitest/globals" />
import { testIndexImports } from '@common/tests/unit/index';
import * as indexModule from '../../src/index';
import * as coreModule from '../../src/core';

const { default: defaultExport, install } = indexModule;

testIndexImports({
  suiteName: 'vue',
  indexModule,
  coreModule,
  expectedDefinedExports: ['PhoneInput', 'vPhoneMask'],
  expectedFunctionExports: ['usePhoneMask', 'install']
});

describe('vue package installation', () => {
  it('keeps default export plugin surface', () => {
    expect(defaultExport).toBeDefined();
    expect(typeof defaultExport.install).toBe('function');
    expect(defaultExport.install).toBe(install);
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
});
