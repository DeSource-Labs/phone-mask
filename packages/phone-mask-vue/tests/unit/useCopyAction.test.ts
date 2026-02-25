/// <reference types="vitest/globals" />
import { ref, nextTick, createApp, h, toValue } from 'vue';
import { useCopyAction } from '../../src/composables/internal/useCopyAction';
import { testUseCopyAction } from '@common/tests/unit/useCopyAction';

/**
 * Mounts a temporary Vue app to run the composable within a component lifecycle.
 * Required so that `onUnmounted` hooks (used by useTimer) are properly registered.
 */
function withSetup<T>(composable: () => T) {
  let result!: T;
  const app = createApp({
    setup() {
      result = composable();
      return {};
    },
    render: () => h('div')
  });
  app.mount(document.createElement('div'));

  const act = async (callback: () => void | Promise<void>): Promise<void> => {
    await callback();
    await nextTick();
  };

  const unmount = () => app.unmount();

  return { result, unmount, act };
}

function setup(formattedPhoneNumber: string) {
  const el = document.createElement('div');
  const liveRef = ref<HTMLElement | null>(el);
  const onCopy = vi.fn();

  const fullFormatted = ref(formattedPhoneNumber);

  const { result, unmount, act } = withSetup(() => useCopyAction({ liveRef, fullFormatted, onCopy }));

  const rerender = ({ fullFormatted: fullFormattedProp }: { fullFormatted: string }) => {
    fullFormatted.value = fullFormattedProp;
  };

  return {
    act,
    toValue,
    result,
    unmount,
    rerender,
    el,
    onCopy
  };
}

testUseCopyAction(setup);
