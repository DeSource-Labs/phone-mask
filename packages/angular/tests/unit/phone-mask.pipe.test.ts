import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { PhoneMaskPipe } from '@src/phone-mask.pipe';
import { createPhoneFormatter, getCountry } from '@desource/phone-mask/kit';
import { Masks, type CountryKey } from '@desource/phone-mask';

@Component({
  selector: 'test-pipe-host',
  imports: [PhoneMaskPipe],
  template: '<span data-testid="phone">{{ value() | phoneMask:country():includeCountryCode() }}</span>'
})
class PipeHost {
  value = signal('2025550123');
  country = signal<CountryKey>('US');
  includeCountryCode = signal(false);
}

describe('PhoneMaskPipe', () => {
  const pipe = new PhoneMaskPipe();

  it('formats a national number and optionally includes its country code', () => {
    expect(pipe.transform('2025550123', 'US')).toBe('202-555-0123');
    expect(pipe.transform('2025550123', 'US', true)).toBe('+1 202-555-0123');
  });

  it.each(['us', 'UNKNOWN'])('handles JavaScript country input %s safely', (country) => {
    expect(pipe.transform('2025550123', country as CountryKey)).toBe('202-555-0123');
  });

  it('returns an empty string for absent values', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('uses the shared formatter for every supported country', () => {
    for (const { id } of Masks) {
      const formatter = createPhoneFormatter(getCountry(id, 'en'));
      const digits = '234567890123456'.slice(0, formatter.getMaxDigits());
      expect(pipe.transform(digits, id)).toBe(formatter.formatDisplay(digits));
    }
  });

  it('updates from signal inputs without Zone.js or manual change detection', async () => {
    const { fixture } = await render(PipeHost, { autoDetectChanges: false });
    expect(screen.getByTestId('phone').textContent).toBe('202-555-0123');
    fixture.componentInstance.includeCountryCode.set(true);
    await fixture.whenStable();
    expect(screen.getByTestId('phone').textContent).toBe('+1 202-555-0123');
    fixture.componentInstance.country.set('GB');
    await fixture.whenStable();
    expect(screen.getByTestId('phone').textContent).toContain('+44');
  });
});
