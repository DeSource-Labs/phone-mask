/// <reference types="vitest/globals" />
import { useValidationHint } from '@src/services/internal/useValidationHint.service';
import { testUseValidationHint } from '@common/tests/unit/useValidationHint';
import { tools, withSetup } from './setup/tools';

function setup() {
  const { result, unmount } = withSetup(() => useValidationHint());

  return {
    result,
    unmount
  };
}

testUseValidationHint(setup, tools);
