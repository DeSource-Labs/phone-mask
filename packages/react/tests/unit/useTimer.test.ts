/// <reference types="vitest/globals" />
import { useTimer } from '@src/hooks/utility/useTimer';
import { testUseTimer } from '@common/tests/unit/useTimer';
import { tools, renderHookWithProxy } from './setup/tools';

function setup() {
  return renderHookWithProxy(() => useTimer());
}

testUseTimer(setup, tools);
