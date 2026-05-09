import { TestBed } from '@angular/core/testing';
import { fireEvent, screen, waitFor } from '@testing-library/angular';
import type { MaybeRef, TestTools } from '@common/tests/unit/setup/tools';

export const act = async (callback: () => void | Promise<void>): Promise<void> => {
  await callback();
  TestBed.tick();
  await Promise.resolve();
};

export const tools: TestTools = {
  toValue: <T>(val: MaybeRef<T>) => {
    if (typeof val === 'function') return (val as () => T)();
    if (val && typeof val === 'object' && 'value' in val) return val.value as T;
    return val as T;
  },
  act,
  waitFor,
  fireEvent,
  screen
};
