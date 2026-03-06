/// <reference types="vitest/globals" />
import { useTheme } from '../../src/composables/internal/useTheme.svelte';
import { testUseTheme, type SetupOptions } from '@common/tests/unit/useTheme';
import { tools, withSetup, createState } from './setup/tools.svelte';

function setup(options: SetupOptions) {
  const themeState = createState(options.theme);

  const { result, unmount } = withSetup(() => useTheme({ theme: () => themeState.value }));

  const rerender = ({ theme }: SetupOptions) => {
    themeState.value = theme;
  };

  return { result, unmount, rerender };
}

testUseTheme(setup, tools);

describe('useTheme fallback (Svelte)', () => {
  it('returns auto theme without matchMedia support', () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      value: undefined,
      configurable: true
    });

    const { result, unmount } = setup({ theme: 'auto' });
    expect(result.themeClass).toBe('theme-light');
    unmount();

    Object.defineProperty(window, 'matchMedia', {
      value: originalMatchMedia,
      configurable: true
    });
  });
});
