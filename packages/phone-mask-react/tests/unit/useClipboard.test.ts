/// <reference types="vitest/globals" />
import { useClipboard } from '@src/hooks/utility/useClipboard';
import { testUseClipboard } from '@common/tests/unit/useClipboard';
import type { SetupOptions } from '@common/tests/unit/useClipboard';
import { tools, renderHookWithProxy } from './setup/tools';

function setup(options: SetupOptions = {}) {
  const { result, unmount } = renderHookWithProxy(() => useClipboard(options.delay));

  return { result, unmount };
}

testUseClipboard(setup, tools);
