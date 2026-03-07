/// <reference types="vitest/globals" />
import { useClipboard } from '../../../src/composables/utility/useClipboard.svelte';
import { testUseClipboard, type SetupOptions } from '@common/tests/unit/useClipboard';
import { tools, withSetup } from '../setup/tools.svelte';

function setup(options: SetupOptions = {}) {
  const { result, unmount } = withSetup(() => useClipboard(options.delay));

  return { result, unmount };
}

testUseClipboard(setup, tools);
