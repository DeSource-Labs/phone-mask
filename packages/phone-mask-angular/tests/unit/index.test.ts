/// <reference types="vitest/globals" />
import { testIndexImports } from '@common/tests/unit/index';
import * as indexModule from '@src/public-api';
import * as coreModule from '@src/core';

testIndexImports({
  suiteName: 'angular',
  indexModule,
  coreModule,
  expectedDefinedExports: ['PhoneInputComponent', 'PhoneMaskDirective', 'PhoneMaskPipe', 'UsePhoneMaskService'],
  expectedFunctionExports: []
});
