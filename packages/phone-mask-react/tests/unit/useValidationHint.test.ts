/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import { useValidationHint } from '../../src/hooks/internal/useValidationHint';
import { testUseValidationHint } from '@common/tests/unit/useValidationHint';
import { tools } from './setup/tools';

function setup() {
  const { result, unmount } = renderHook(() => useValidationHint());

  // Proxy ensures we always read the latest result.current after re-renders
  const resultProxy = new Proxy({} as ReturnType<typeof useValidationHint>, {
    get(_target, key) {
      return result.current[key as keyof typeof result.current];
    }
  });

  return {
    result: resultProxy,
    unmount
  };
}

testUseValidationHint(setup, tools);
