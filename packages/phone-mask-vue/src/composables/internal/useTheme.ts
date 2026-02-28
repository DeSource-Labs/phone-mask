import { ref, computed, toValue, onBeforeMount, onBeforeUnmount } from 'vue';
import type { MaybeRefOrGetter } from 'vue';

import type { Theme } from '../../types';

interface UseThemeOptions {
  theme: MaybeRefOrGetter<Theme>;
}

export function useTheme({ theme }: UseThemeOptions) {
  const systemDark = ref<boolean>(false);

  const themeClass = computed<string>(() => {
    return toValue(theme) !== 'auto' ? `theme-${toValue(theme)}` : systemDark.value ? 'theme-dark' : 'theme-light';
  });

  let mq: MediaQueryList | null = null;

  const handler = (e: MediaQueryListEvent) => {
    systemDark.value = e.matches;
  };

  onBeforeMount(() => {
    if (typeof window === 'undefined') return;
    mq = window.matchMedia('(prefers-color-scheme: dark)');
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
