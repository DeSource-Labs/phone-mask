/// <reference types="vitest/globals" />
import { ref } from 'vue';
import { useCopyAction } from '../../src/composables/internal/useCopyAction';
import { testUseCopyAction } from '@common/tests/unit/useCopyAction';
import { tools, withSetup } from './setup/tools';

function setup(formattedPhoneNumber: string) {
  const el = document.createElement('div');
  const liveRef = ref<HTMLElement | null>(el);
  const onCopy = vi.fn();

  const fullFormatted = ref(formattedPhoneNumber);

  const { result, unmount } = withSetup(() => useCopyAction({ liveRef, fullFormatted, onCopy }));

  const rerender = ({ fullFormatted: fullFormattedProp }: { fullFormatted: string }) => {
    fullFormatted.value = fullFormattedProp;
  };

  return {
    result,
    unmount,
    rerender,
    el,
    onCopy
  };
}

testUseCopyAction(setup, tools);
