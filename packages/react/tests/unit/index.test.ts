/// <reference types="vitest/globals" />
import { testIndexImports } from '@common/tests/unit/index';
import * as indexModule from '../../src/index';
import * as coreModule from '../../src/core';

testIndexImports({
  suiteName: 'react',
  indexModule,
  coreModule,
  expectedDefinedExports: ['PhoneInput'],
  expectedFunctionExports: ['usePhoneMask']
});
