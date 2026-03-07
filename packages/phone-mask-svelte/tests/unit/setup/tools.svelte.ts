import { mount, unmount, flushSync } from 'svelte';
import { fireEvent, screen, waitFor } from '@testing-library/svelte';
import type { TestTools } from '@common/tests/unit/setup/tools';
import TestWrapper from './TestWrapper.svelte';

export const act = async (callback: () => void | Promise<void>): Promise<void> => {
  await callback();
  flushSync();
};

export const tools: TestTools = {
  toValue: (val: unknown) => val,
  act,
  waitFor,
  fireEvent,
  screen
};

/**
 * Mounts a temporary Svelte app to run the composable within a component lifecycle.
 * Required so that `onDestroy` hooks (used by useTimer) are properly registered.
 */
export function withSetup<T>(composable: () => T): { result: T; unmount: () => void } {
  let result!: T;

  const component = mount(TestWrapper, {
    target: document.createElement('div'),
    props: {
      composable: () => {
        result = composable();
      }
    }
  });

  flushSync();

  return {
    result,
    unmount: () => unmount(component)
  };
}

/**
 * Creates a reactive state container that can be used in test files.
 * The state is created using Svelte 5 runes and integrates with the reactive system.
 */
export function createState<T>(initial: T) {
  let _value = $state(initial);

  return {
    get value() {
      return _value;
    },
    set value(v: T) {
      _value = v;
    }
  };
}
