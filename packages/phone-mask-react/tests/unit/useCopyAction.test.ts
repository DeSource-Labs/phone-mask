/// <reference types="vitest/globals" />
import { useCopyAction } from '../../src/hooks/internal/useCopyAction';
import { testUseCopyAction } from '@common/tests/unit/useCopyAction';
import { tools, renderHookWithProxy } from './setup/tools';

function setup(formattedPhoneNumber: string) {
  const el = document.createElement('div');
  const liveRef = { current: el };
  const onCopy = vi.fn();

  const { result, unmount, rerender } = renderHookWithProxy(
    ({ fullFormatted }: { fullFormatted: string }) => useCopyAction({ liveRef, fullFormatted, onCopy }),
    { initialProps: { fullFormatted: formattedPhoneNumber } }
  );

  return { result, unmount, rerender, el, onCopy };
}

testUseCopyAction(setup, tools);
