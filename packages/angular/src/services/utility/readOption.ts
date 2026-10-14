import type { MaybeGetter } from '../../types';

export function readOption<T>(value: MaybeGetter<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value;
}
