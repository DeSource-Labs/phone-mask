import { ref, computed, toValue, onBeforeMount, onBeforeUnmount, type MaybeRefOrGetter } from 'vue';
import type { Theme } from '../../types';

interface UseThemeOptions {
  theme: MaybeRefOrGetter<Theme>;
}

export function useTheme({ theme }: UseThemeOptions) {
  const systemDark = ref<boolean>(false);

  const themeClass = computed<string>(() => {
    const resolvedTheme = toValue(theme);

    if (resolvedTheme === 'auto') {
      return systemDark.value ? 'theme-dark' : 'theme-light';
    }

    return `theme-${resolvedTheme}`;
  });

  let mq: MediaQueryList | null = null;

  const handler = (e: MediaQueryListEvent) => {
    systemDark.value = e.matches;
  };

  onBeforeMount(() => {
    mq = globalThis.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
    if (!mq) return;
    systemDark.value = mq.matches;
    mq.addEventListener('change', handler);
  });

  onBeforeUnmount(() => {
    mq?.removeEventListener('change', handler);
  });

  return {
    themeClass
  };
}
