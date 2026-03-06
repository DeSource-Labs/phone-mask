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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useTheme fallback (Svelte)', () => {
  it('returns auto theme without matchMedia support', () => {
    vi.stubGlobal('matchMedia', undefined as any);

    const { result, unmount } = setup({ theme: 'auto' });
    expect(result.themeClass).toBe('theme-light');
    unmount();
  });
});
