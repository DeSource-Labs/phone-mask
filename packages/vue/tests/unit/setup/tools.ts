import { nextTick, toValue, createApp, h } from 'vue';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import type { TestTools, MaybeRef } from '@common/tests/unit/setup/tools';

export const act = async (callback: () => void | Promise<void>): Promise<void> => {
  await callback();
  await nextTick();
};

export const tools: TestTools = {
  toValue: toValue as <T>(val: MaybeRef<T>) => T,
  act,
  waitFor,
  fireEvent,
  screen
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
