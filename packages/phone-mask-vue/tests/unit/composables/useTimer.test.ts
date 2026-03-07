/// <reference types="vitest/globals" />
import { useTimer } from '../../../src/composables/utility/useTimer';
import { testUseTimer } from '@common/tests/unit/useTimer';
import { tools, withSetup } from '../setup/tools';

function setup() {
  const { result, unmount } = withSetup(() => useTimer());

  return { result, unmount };
}

testUseTimer(setup, tools);
