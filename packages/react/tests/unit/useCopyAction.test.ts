/// <reference types="vitest/globals" />
import { useCopyAction } from '@src/hooks/internal/useCopyAction';
import { testUseCopyAction } from '@common/tests/unit/useCopyAction';
import type { SetupOptions } from '@common/tests/unit/useCopyAction';
import { tools, renderHookWithProxy } from './setup/tools';

function setup(options: SetupOptions) {
  const el = document.createElement('div');
  const liveRef = { current: options.disableLiveRef ? null : el };
  const onCopy = vi.fn();

  const { result, unmount, rerender } = renderHookWithProxy(
    ({ fullFormatted }: SetupOptions) => useCopyAction({ fullFormatted, liveRef, onCopy }),
    { initialProps: { fullFormatted: options.fullFormatted } }
  );

  return { result, unmount, rerender, el, onCopy };
}

testUseCopyAction(setup, tools);
