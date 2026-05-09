import { describe, expect, it } from 'vitest';
import { PhoneMaskPipe } from '../../src/phone-mask.pipe';
import { PhoneMaskService } from '../../src/phone-mask.service';

describe('PhoneMaskService', () => {
  const service = new PhoneMaskService({ country: 'US', locale: 'en' });

  it('formats national display values', () => {
    expect(service.format('2025551234')).toBe('202-555-1234');
  });

  it('returns full phone payloads', () => {
    expect(service.getPhoneNumber('2025551234')).toEqual({
      digits: '2025551234',
      full: '+12025551234',
      fullFormatted: '+1 202-555-1234'
    });
  });

  it('checks completion against the selected country mask', () => {
    expect(service.isComplete('2025551234')).toBe(true);
    expect(service.isComplete('202555')).toBe(false);
  });
});

describe('PhoneMaskPipe', () => {
  const pipe = new PhoneMaskPipe({ country: 'US', locale: 'en' });

  it('supports display, full, fullFormatted, and placeholder modes', () => {
    expect(pipe.transform('2025551234')).toBe('202-555-1234');
    expect(pipe.transform('2025551234', { mode: 'full' })).toBe('+12025551234');
    expect(pipe.transform('2025551234', { mode: 'fullFormatted' })).toBe('+1 202-555-1234');
    expect(pipe.transform('', { mode: 'placeholder' })).toBe('###-###-####');
  });

  it('accepts country, mode, and locale shorthand arguments', () => {
    expect(pipe.transform('442071234567', 'GB', 'fullFormatted', 'en')).toMatch(/^\+44 /);
  });
});
