/// <reference types="vitest/globals" />
import { useClipboard } from '../../../src/composables/utility/useClipboard';
import { testUseClipboard } from '@common/tests/unit/useClipboard';
import type { SetupOptions } from '@common/tests/unit/useClipboard';
import { tools, withSetup } from '../setup/tools';

function setup(options: SetupOptions = {}) {
  const { result, unmount } = withSetup(() => useClipboard(options.delay));

  return { result, unmount };
}

testUseClipboard(setup, tools);
