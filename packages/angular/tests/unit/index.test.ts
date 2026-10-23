import { testIndexImports } from '@common/tests/unit/index';
import * as indexModule from '@src/public-api';
import * as coreModule from '@core/public-api';

testIndexImports({
  suiteName: 'angular',
  indexModule,
  coreModule,
  expectedDefinedExports: ['PhoneInputComponent', 'PhoneMaskDirective', 'PhonePipe'],
  expectedFunctionExports: ['usePhoneMask']
});

it('runs the Angular test environment without Zone.js', () => {
  expect(globalThis).not.toHaveProperty('Zone');
});
