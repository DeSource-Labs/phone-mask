/// <reference types="vitest/globals" />
import { useCopyAction } from '../../src/composables/internal/useCopyAction.svelte';
import { testUseCopyAction, type SetupOptions } from '@common/tests/unit/useCopyAction';
import { tools, withSetup, createState } from './setup/tools.svelte';

function setup(options: SetupOptions) {
  const el = document.createElement('div');
  const liveRefState = createState<HTMLElement | null>(options.disableLiveRef ? null : el);
  const fullFormattedState = createState(options.fullFormatted);
  const onCopy = vi.fn();

  const { result, unmount } = withSetup(() =>
    useCopyAction({
      liveRef: () => liveRefState.value,
      fullFormatted: () => fullFormattedState.value,
      onCopy
    })
  );

  const rerender = ({ fullFormatted }: { fullFormatted: string }) => {
    fullFormattedState.value = fullFormatted;
  };

  return { result, unmount, rerender, el, onCopy };
}

testUseCopyAction(setup, tools);
