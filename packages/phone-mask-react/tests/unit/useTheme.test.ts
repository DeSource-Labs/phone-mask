/// <reference types="vitest/globals" />
import { useTheme } from '../../src/hooks/internal/useTheme';
import { testUseTheme } from '@common/tests/unit/useTheme';
import type { SetupOptions } from '@common/tests/unit/useTheme';
import { tools, renderHookWithProxy } from './setup/tools';

function setup(options: SetupOptions) {
  const { result, unmount, rerender } = renderHookWithProxy(({ theme }: SetupOptions) => useTheme({ theme }), {
    initialProps: options
  });

  return { result, unmount, rerender };
}

testUseTheme(setup, tools);
