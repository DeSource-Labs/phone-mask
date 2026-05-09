import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PhoneMaskPipe } from '@src/phone-mask.pipe';

describe('PhoneMaskPipe', () => {
  const setup = () => {
    return TestBed.runInInjectionContext(() => new PhoneMaskPipe());
  };

  it('supports display, full, fullFormatted, and placeholder modes', () => {
    const pipe = setup();
    expect(pipe.transform('2025551234')).toBe('202-555-1234');
    expect(pipe.transform('2025551234', { mode: 'full' })).toBe('+12025551234');
    expect(pipe.transform('2025551234', { mode: 'fullFormatted' })).toBe('+1 202-555-1234');
    expect(pipe.transform('', { mode: 'placeholder' })).toBe('###-###-####');
  });

  it('accepts country, mode, and locale shorthand arguments', () => {
    const pipe = setup();
    expect(pipe.transform('442071234567', 'GB', 'fullFormatted', 'en')).toMatch(/^\+44 /);
  });
});
