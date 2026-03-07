/// <reference types="vitest/globals" />
import { useTimer } from '../../../src/composables/utility/useTimer.svelte';
import { testUseTimer } from '@common/tests/unit/useTimer';
import { tools, withSetup } from '../setup/tools.svelte';

function setup() {
  const { result, unmount } = withSetup(() => useTimer());

  return { result, unmount };
}

testUseTimer(setup, tools);
