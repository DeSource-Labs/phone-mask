import type { Theme } from '../../types';

interface UseThemeOptions {
  theme: () => Theme;
}

export function useTheme({ theme }: UseThemeOptions) {
  let systemDark = $state(false);

  const themeClass = $derived<string>((() => {
    const resolvedTheme = theme();
    if (resolvedTheme === 'auto') {
      return systemDark ? 'theme-dark' : 'theme-light';
    }
    return `theme-${resolvedTheme}`;
  })());

  $effect(() => {
    const mq = globalThis.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
    if (!mq) return;
    systemDark = mq.matches;
    const handler = (e: MediaQueryListEvent) => {
      systemDark = e.matches;
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  });

  return {
    get themeClass() {
      return themeClass;
    }
  };
}
