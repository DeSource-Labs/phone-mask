import { act, renderHook, type RenderHookOptions } from '@testing-library/react';
import type { TestTools } from '@common/tests/unit/setup/tools';

export const tools: TestTools = {
  act,
  toValue: (val: unknown) => val
};

function createResultProxy<T extends object>(result: { current: T }): T {
  return new Proxy({} as T, {
    get(_target, key) {
      return result.current[key as keyof T];
    }
  });
}

export function renderHookWithProxy<Result extends object, Props>(
  render: (props: Props) => Result,
  options?: RenderHookOptions<Props>
) {
  const { result, unmount, rerender } = renderHook(render, options);

  return {
    result: createResultProxy(result),
    unmount,
    rerender
  };
}
