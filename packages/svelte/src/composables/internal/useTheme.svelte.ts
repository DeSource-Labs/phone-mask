import type { Theme } from '../../types.js';

interface UseThemeOptions {
  theme: () => Theme;
}

export function useTheme({ theme }: UseThemeOptions) {
  let systemDark = $state(false);

  const themeClass = $derived.by<string>(() => {
    let resolvedTheme = theme();
    if (resolvedTheme === 'auto') {
      resolvedTheme = systemDark ? 'dark' : 'light';
    }
    return `theme-${resolvedTheme}`;
  });

  $effect(() => {
    const mq = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
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
