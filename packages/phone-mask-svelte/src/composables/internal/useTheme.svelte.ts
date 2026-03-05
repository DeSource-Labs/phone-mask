import type { Theme } from '../../types';

interface UseThemeOptions {
  theme: () => Theme;
}

export function useTheme({ theme }: UseThemeOptions) {
  let systemDark = $state(false);

  const themeClass = $derived<string>(
    theme() !== 'auto' ? `theme-${theme()}` : systemDark ? 'theme-dark' : 'theme-light'
  );

  $effect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
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
