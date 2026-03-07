/// <reference types="vitest/globals" />
import { useValidationHint } from '../../../src/composables/internal/useValidationHint';
import { testUseValidationHint } from '@common/tests/unit/useValidationHint';
import { tools, withSetup } from '../setup/tools';

function setup() {
  const { result, unmount } = withSetup(() => useValidationHint());

  return {
    result,
    unmount
  };
}

testUseValidationHint(setup, tools);
