import { ref, computed, toValue, onMounted, onBeforeUnmount, type MaybeRefOrGetter } from 'vue';
import type { Theme } from '../../types.js';

interface UseThemeOptions {
  theme: MaybeRefOrGetter<Theme>;
}

export function useTheme({ theme }: UseThemeOptions) {
  const systemDark = ref<boolean>(false);

  const themeClass = computed<string>(() => {
    let resolvedTheme = toValue(theme);

    if (resolvedTheme === 'auto') {
      resolvedTheme = systemDark.value ? 'dark' : 'light';
    }

    return `theme-${resolvedTheme}`;
  });

  let mq: MediaQueryList | undefined;

  const handler = (e: MediaQueryListEvent) => {
    systemDark.value = e.matches;
  };

  onMounted(() => {
    mq = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
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
