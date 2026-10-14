import { afterNextRender, computed, DestroyRef, inject, signal } from '@angular/core';
import type { MaybeGetter, Theme } from '../../types';
import { readOption } from '../utility/readOption';

export function useTheme({ theme }: { theme: MaybeGetter<Theme> }) {
  const destroyRef = inject(DestroyRef);
  const systemDark = signal(false);
  const themeClass = computed(() => {
    let resolvedTheme = readOption(theme);
    if (resolvedTheme === 'auto') resolvedTheme = systemDark() ? 'dark' : 'light';
    return `theme-${resolvedTheme}`;
  });

  afterNextRender(() => {
    const media = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;
    const handleChange = (event: MediaQueryListEvent) => systemDark.set(event.matches);
    systemDark.set(media.matches);
    media.addEventListener('change', handleChange);
    destroyRef.onDestroy(() => media.removeEventListener('change', handleChange));
  });

  return { themeClass };
}
