import { booleanAttribute } from '@angular/core';

export function optionalBooleanAttribute(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  return booleanAttribute(value);
}
