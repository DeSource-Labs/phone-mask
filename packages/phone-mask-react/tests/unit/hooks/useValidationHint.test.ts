/// <reference types="vitest/globals" />
import { useValidationHint } from '../../../src/hooks/internal/useValidationHint';
import { testUseValidationHint } from '@common/tests/unit/useValidationHint';
import { tools, renderHookWithProxy } from '../setup/tools';

function setup() {
  return renderHookWithProxy(() => useValidationHint());
}

testUseValidationHint(setup, tools);
