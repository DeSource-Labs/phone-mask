/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import { useCopyAction } from '../../src/hooks/internal/useCopyAction';
import { testUseCopyAction } from '@common/tests/unit/useCopyAction';
import { tools } from './setup/tools';

function setup(formattedPhoneNumber: string) {
  const el = document.createElement('div');
  const liveRef = { current: el };
  const onCopy = vi.fn();

  const { result, unmount, rerender } = renderHook(
    ({ fullFormatted }: { fullFormatted: string }) => useCopyAction({ liveRef, fullFormatted, onCopy }),
    { initialProps: { fullFormatted: formattedPhoneNumber } }
  );

  // Proxy ensures we always read the latest result.current after re-renders
  const resultProxy = new Proxy({} as ReturnType<typeof useCopyAction>, {
    get(_target, key) {
      return result.current[key as keyof typeof result.current];
    }
  });

  return {
    result: resultProxy,
    unmount,
    rerender,
    el,
    onCopy
  };
}

testUseCopyAction(setup, tools);
