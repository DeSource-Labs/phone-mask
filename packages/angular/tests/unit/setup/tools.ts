import {
  Component,
  EnvironmentInjector,
  createEnvironmentInjector,
  isSignal,
  runInInjectionContext,
  type Signal
} from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { fireEvent as domFireEvent, screen, waitFor } from '@testing-library/dom';
import type { MaybeRef, TestTools } from '@common/tests/unit/setup/tools';

const fixtures = new Set<ComponentFixture<unknown>>();

export async function stabilize() {
  TestBed.flushEffects();
  if (vi.isFakeTimers()) await vi.advanceTimersByTimeAsync(0);
  await Promise.all(Array.from(fixtures, (fixture) => fixture.whenStable()));
}

export function trackFixture<T>(fixture: ComponentFixture<T>) {
  fixtures.add(fixture);
  fixture.componentRef.onDestroy(() => fixtures.delete(fixture));
  return fixture;
}

export const act = async (callback: () => void | Promise<void>) => {
  await callback();
  await stabilize();
};

const fireEvent = Object.fromEntries(
  Object.entries(domFireEvent).map(([key, fire]) => [
    key,
    async (...args: Parameters<typeof domFireEvent>) => {
      const result = fire(...args);
      await stabilize();
      return result;
    }
  ])
) as unknown as TestTools['fireEvent'];

export const tools: TestTools = {
  toValue: <T>(value: MaybeRef<T>): T => {
    if (isSignal(value)) return value() as T;
    if (value && typeof value === 'object' && 'value' in value) return value.value;
    return value as T;
  },
  act,
  waitFor,
  fireEvent,
  screen
};

type Refs<T> = { [K in keyof T]: T[K] extends Signal<infer Value> ? { readonly value: Value } : T[K] };

export function asRefs<T extends object>(result: T): Refs<T> {
  return Object.fromEntries(
    Object.entries(result).map(([key, value]) => [
      key,
      isSignal(value)
        ? {
            get value() {
              return value();
            }
          }
        : value
    ])
  ) as Refs<T>;
}

@Component({ selector: 'test-service-host', template: '' })
class ServiceHost {}

/** Gives signal factories a render lifecycle and destroys their injection scope. */
export function withSetup<T extends object>(factory: () => T) {
  const fixture = trackFixture(TestBed.createComponent(ServiceHost));
  const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
  fixture.componentRef.onDestroy(() => injector.destroy());
  const result = runInInjectionContext(injector, factory);
  fixture.autoDetectChanges();
  TestBed.flushEffects();
  return { result: asRefs(result), raw: result, unmount: () => fixture.destroy() };
}
