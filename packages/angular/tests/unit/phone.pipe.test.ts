import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { PhonePipe } from '@src/phone.pipe';
import { MasksWithFlag, type CountryKey } from '@desource/phone-mask';
import type { PhonePipeOptions } from '@src/types';

@Component({
  selector: 'test-pipe-host',
  imports: [PhonePipe],
  template: `
    <span data-testid="phone">{{ value() | phone: country() : { code: code(), flag: flag() } }}</span>
    <span>{{ unrelated() }}</span>
  `
})
class PipeHost {
  readonly value = signal('+12345678888');
  readonly country = signal<CountryKey>('US');
  readonly code = signal(true);
  readonly flag = signal(false);
  readonly unrelated = signal(0);
}

describe('PhonePipe', () => {
  const pipe = new PhonePipe();
  const displays: [PhonePipeOptions | undefined, string][] = [
    [undefined, '+1 234 567 8888'],
    [{ code: false }, '234 567 8888'],
    [{ flag: true }, '🇺🇸 +1 234 567 8888'],
    [{ code: false, flag: true }, '🇺🇸 234 567 8888']
  ];

  describe.each(['+12345678888', '2345678888', '+1 234 567 8888', '234 567 8888', '+1 (234) 567-8888', '234-567-8888'])(
    'input %s',
    (value) => {
      it.each(displays)('formats with options %j', (options, expected) => {
        expect(pipe.transform(value, 'US', options)).toBe(expected);
      });
    }
  );

  it('accepts lowercase country codes and surrounding whitespace', () => {
    expect(pipe.transform(' \t+1 234 567 8888\n', 'us' as CountryKey, { flag: true })).toBe('🇺🇸 +1 234 567 8888');
  });

  it.each(['', ' \t\n', null, undefined])('returns an empty string for %j without a code or flag', (value) => {
    expect(pipe.transform(value, 'US', { flag: true })).toBe('');
  });

  it.each(['UNKNOWN', '', undefined, null])('preserves the input for unsupported country %j', (country) => {
    expect(pipe.transform('+1 234 567 8888', country as CountryKey, { flag: true })).toBe('+1 234 567 8888');
  });

  it.each([
    '+442079460958', // The explicit calling code does not match US.
    '12345678888', // Bare digits are national; never guess a calling code or truncate.
    '+123456788889',
    '+1 234 567 8888 ext. 42',
    '+1 234 567 8888 x42',
    'tel:+12345678888',
    '1-800-FLOWERS',
    '++12345678888',
    '234+5678888',
    'not a phone number',
    '+1',
    '+',
    '()-'
  ])('preserves unsupported input %j instead of changing the number', (value) => {
    expect(pipe.transform(value, 'US', { code: false, flag: true })).toBe(value);
  });

  it('preserves national digits that start with the country calling code', () => {
    expect(pipe.transform('49123456', 'DE')).toBe('+49 49 123456');
    expect(pipe.transform('+4949123456', 'DE')).toBe('+49 49 123456');
  });

  it('preserves significant leading zeros', () => {
    expect(pipe.transform('0612345678', 'IT')).toBe('+39 06 1234 5678');
    expect(pipe.transform('+39 06 1234 5678', 'IT', { code: false })).toBe('06 1234 5678');
  });

  it('uses the selected country flag when countries share a calling code', () => {
    expect(pipe.transform('+12345678888', 'CA', { flag: true })).toBe('🇨🇦 +1 234 567 8888');
  });

  it.each([
    ['2', '+1 2'],
    ['234', '+1 234'],
    ['234567', '+1 234 567']
  ])('formats incomplete national input %s without trailing separators', (value, expected) => {
    expect(pipe.transform(value, 'US')).toBe(expected);
  });

  it('preserves every digit and round-trips every country and mask length', () => {
    for (const { id, code, flag, mask } of MasksWithFlag) {
      for (const template of mask) {
        const digits = '2'.repeat(template.split('#').length - 1);
        const national = pipe.transform(digits, id, { code: false });
        const international = pipe.transform(`${code}${digits}`, id);
        expect(national.replace(/\D/g, ''), id).toBe(digits);
        expect(national, id).toMatch(/^\d+( \d+)*$/);
        expect(international, id).toBe(`${code} ${national}`);
        expect(pipe.transform(national, id), id).toBe(international);
        expect(pipe.transform(international, id, { code: false }), id).toBe(national);
        expect(pipe.transform(digits, id, { flag: true }), id).toBe(`${flag} ${international}`);
      }
    }
  });

  it('updates value, country, and inline options without Zone.js or manual change detection', async () => {
    const { fixture } = await render(PipeHost, { autoDetectChanges: false });
    expect(screen.getByTestId('phone').textContent).toBe('+1 234 567 8888');
    fixture.componentInstance.code.set(false);
    await fixture.whenStable();
    expect(screen.getByTestId('phone').textContent).toBe('234 567 8888');
    fixture.componentInstance.flag.set(true);
    await fixture.whenStable();
    expect(screen.getByTestId('phone').textContent).toBe('🇺🇸 234 567 8888');
    fixture.componentInstance.country.set('GB');
    fixture.componentInstance.value.set('+442079460958');
    fixture.componentInstance.code.set(true);
    await fixture.whenStable();
    expect(screen.getByTestId('phone').textContent).toBe('🇬🇧 +44 207 946 0958');
  });

  it('does not reformat on unrelated updates, including inline options', async () => {
    const transform = vi.spyOn(PhonePipe.prototype, 'transform');
    try {
      const { fixture } = await render(PipeHost, { autoDetectChanges: false });
      transform.mockClear();
      fixture.componentInstance.unrelated.set(1);
      await fixture.whenStable();
      expect(transform).not.toHaveBeenCalled();
    } finally {
      transform.mockRestore();
    }
  });
});
