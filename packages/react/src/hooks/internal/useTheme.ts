import { useEffect, useState } from 'react';

import type { Theme } from '../../types.js';

interface UseThemeOptions {
  theme: Theme;
}

export function useTheme({ theme }: UseThemeOptions) {
  const [systemDark, setSystemDark] = useState(false);

  const systemTheme = systemDark ? 'dark' : 'light';
  const resolvedTheme = theme === 'auto' ? systemTheme : theme;

  // Track system color scheme reactively so theme:'auto' responds to OS changes at runtime
  useEffect(() => {
    const mq = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    setSystemDark(mq.matches);

    const handler = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };

    mq.addEventListener('change', handler);

    return () => mq.removeEventListener('change', handler);
  }, []);

  return {
    themeClass: `theme-${resolvedTheme}`
  };
}
