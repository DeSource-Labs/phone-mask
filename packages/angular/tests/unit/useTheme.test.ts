/// <reference types="vitest/globals" />
import { signal } from '@angular/core';
import { useTheme } from '@src/services/internal/useTheme.service';
import { testUseTheme } from '@common/tests/unit/useTheme';
import type { SetupOptions } from '@common/tests/unit/useTheme';
import { tools, withSetup } from './setup/tools';

function setup(options: SetupOptions) {
  const theme = signal(options.theme);

  const { result, unmount } = withSetup(() => useTheme({ theme }));

  const rerender = ({ theme: newTheme }: SetupOptions) => {
    theme.set(newTheme);
  };

  return { result, unmount, rerender };
}

testUseTheme(setup, tools);
