import { useEffect, useState } from 'react';

import type { Theme } from '../../types';

interface UseThemeOptions {
  theme: Theme;
}

export function useTheme({ theme }: UseThemeOptions) {
  const [systemDark, setSystemDark] = useState(false);

  let themeClass = `theme-${theme}`;

  if (theme === 'auto') {
    themeClass = systemDark ? 'theme-dark' : 'theme-light';
  }

  // Track system color scheme reactively so theme:'auto' responds to OS changes at runtime
  useEffect(() => {
    const mq = globalThis.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
    if (!mq) return;
    setSystemDark(mq.matches);

    const handler = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };

    mq.addEventListener('change', handler);

    return () => mq.removeEventListener('change', handler);
  }, []);

  return {
    themeClass
  };
}
