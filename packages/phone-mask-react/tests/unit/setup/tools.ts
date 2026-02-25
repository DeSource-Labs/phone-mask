import { act } from '@testing-library/react';
import type { TestTools } from '@common/tests/unit/setup/tools';

export const tools: TestTools = {
  act,
  toValue: (val: unknown) => val
};
