import { nextTick, toValue, createApp, h } from 'vue';
import type { TestTools } from '@common/tests/unit/setup/tools';

export const tools: TestTools = {
  act: async (callback: () => void | Promise<void>): Promise<void> => {
    await callback();
    await nextTick();
  },
  toValue
};

/**
 * Mounts a temporary Vue app to run the composable within a component lifecycle.
 * Required so that `onUnmounted` hooks (used by useTimer) are properly registered.
 */
export function withSetup<T>(composable: () => T) {
  let result!: T;

  const app = createApp({
    setup() {
      result = composable();
      return {};
    },
    render: () => h('div')
  });

  app.mount(document.createElement('div'));

  const unmount = () => app.unmount();

  return { result, unmount };
}
