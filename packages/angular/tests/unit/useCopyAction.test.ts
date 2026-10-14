/// <reference types="vitest/globals" />
import { signal } from '@angular/core';
import { useCopyAction } from '@src/services/internal/useCopyAction.service';
import { testUseCopyAction } from '@common/tests/unit/useCopyAction';
import type { SetupOptions } from '@common/tests/unit/useCopyAction';
import { tools, withSetup } from './setup/tools';

function setup(options: SetupOptions) {
  const el = document.createElement('div');
  const liveRef = signal<HTMLElement | null>(options.disableLiveRef ? null : el);
  const onCopy = vi.fn();

  const fullFormatted = signal(options.fullFormatted);

  const { result, unmount } = withSetup(() => useCopyAction({ liveRef, fullFormatted, onCopy }));

  const rerender = ({ fullFormatted: fullFormattedProp }: { fullFormatted: string }) => {
    fullFormatted.set(fullFormattedProp);
  };

  return {
    result,
    unmount,
    rerender,
    el,
    onCopy
  };
}

testUseCopyAction(setup, tools);
