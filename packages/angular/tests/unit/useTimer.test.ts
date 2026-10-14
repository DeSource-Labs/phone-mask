/// <reference types="vitest/globals" />
import { useTimer } from '@src/services/utility/useTimer.service';
import { testUseTimer } from '@common/tests/unit/useTimer';
import { tools, withSetup } from './setup/tools';

function setup() {
  const { result, unmount } = withSetup(() => useTimer());

  return { result, unmount };
}

testUseTimer(setup, tools);
