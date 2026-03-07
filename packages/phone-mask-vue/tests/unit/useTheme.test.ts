/// <reference types="vitest/globals" />
import { ref } from 'vue';
import { useTheme } from '@src/composables/internal/useTheme';
import { testUseTheme } from '@common/tests/unit/useTheme';
import type { SetupOptions } from '@common/tests/unit/useTheme';
import { tools, withSetup } from './setup/tools';

function setup(options: SetupOptions) {
  const theme = ref(options.theme);

  const { result, unmount } = withSetup(() => useTheme({ theme }));

  const rerender = ({ theme: newTheme }: SetupOptions) => {
    theme.value = newTheme;
  };

  return { result, unmount, rerender };
}

testUseTheme(setup, tools);
