import { MasksWithFlag, type CountryKey } from '@src/index';
import { formatPhone, type PhoneFormatOptions } from '@src/kit';

describe('formatPhone', () => {
  const displays: [PhoneFormatOptions | undefined, string][] = [
    [undefined, '+1 234 567 8888'],
    [{ code: false }, '234 567 8888'],
    [{ flag: true }, '🇺🇸 +1 234 567 8888'],
    [{ code: false, flag: true }, '🇺🇸 234 567 8888']
  ];

  describe.each(['+12345678888', '2345678888', '+1 234 567 8888', '234 567 8888', '+1 (234) 567-8888', '234-567-8888'])(
    'input %s',
    (value) => {
      it.each(displays)('formats with options %j', (options, expected) => {
        expect(formatPhone(value, 'US', options)).toBe(expected);
      });
    }
  );

  it('accepts lowercase country codes and surrounding whitespace', () => {
    expect(formatPhone(' \t+1 234 567 8888\n', 'us' as CountryKey, { flag: true })).toBe('🇺🇸 +1 234 567 8888');
  });

  it.each(['', ' \t\n', null, undefined])('returns an empty string for %j without a code or flag', (value) => {
    expect(formatPhone(value, 'US', { flag: true })).toBe('');
  });

  it.each(['UNKNOWN', ''])('preserves the input for unsupported country %j', (country) => {
    expect(formatPhone('+1 234 567 8888', country as CountryKey, { flag: true })).toBe('+1 234 567 8888');
  });

  it.each([
    '12345678888', // Bare digits exclude the calling code; never guess a prefix or truncate.
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
    expect(formatPhone(value, 'US', { code: false, flag: true })).toBe(value);
  });

  it('does not strip digits resembling a calling code without an explicit prefix', () => {
    expect(formatPhone('49123456', 'DE')).toBe('+49 49 123456');
    expect(formatPhone('+4949123456', 'DE')).toBe('+49 49 123456');
  });

  it('preserves significant leading zeros', () => {
    expect(formatPhone('0612345678', 'IT')).toBe('+39 061 234 5678');
    expect(formatPhone('+39 06 1234 5678', 'IT', { code: false })).toBe('061 234 5678');
  });

  it('uses the selected country flag when countries share a calling code', () => {
    expect(formatPhone('+12345678888', 'CA', { flag: true })).toBe('🇨🇦 +1 234 567 8888');
    expect(formatPhone('+7 123 456 7788', 'RU', { flag: true })).toBe('🇷🇺 +7 123 456 77 88');
    expect(formatPhone('+71234567788', 'KZ', { flag: true })).toBe('🇰🇿 +7 123 456 7788');
  });

  it.each([undefined, null])('detects international numbers when country is %j', (country) => {
    expect(formatPhone('+12345678888', country, { flag: true })).toBe('🇺🇸 +1 234 567 8888');
    expect(formatPhone('+7 123 456 7788', country, { flag: true })).toBe('🇰🇿 +7 123 456 7788');
    expect(formatPhone('+71234567788', country, { code: false, flag: true })).toBe('🇷🇺 123 456 77 88');
    expect(formatPhone('+7 (123) 456-77-88', country)).toBe('+7 123 456 77 88');
  });

  it.each(['2345678888', '234 567 8888', '+7123', '+99912345678', '+1 234 567 8888 ext. 42'])(
    'preserves %j when no country is supplied and detection fails',
    (value) => {
      expect(formatPhone(value)).toBe(value);
    }
  );

  it('uses a successfully detected calling code instead of changing the number to the supplied country', () => {
    expect(formatPhone('+442079460958', 'US', { flag: true })).toBe('🇬🇧 +44 2079 460958');
    expect(formatPhone('+7 123 456 7788', 'US', { code: false, flag: true })).toBe('🇰🇿 123 456 7788');
    expect(formatPhone('+7 123 456 7788', 'US')).toBe('+7 123 456 7788');
  });

  it.each(['+7123', '+712345677889', '+99912345678'])(
    'preserves a conflicting international number when detection fails: %s',
    (value) => {
      expect(formatPhone(value, 'US', { flag: true })).toBe(value);
    }
  );

  it.each([
    ['2', '+1 2'],
    ['234', '+1 234'],
    ['234567', '+1 234 567']
  ])('formats incomplete digits %s without trailing separators', (value, expected) => {
    expect(formatPhone(value, 'US')).toBe(expected);
  });

  it('preserves every digit and round-trips every country and mask length', () => {
    for (const { id, code, flag, mask } of MasksWithFlag) {
      for (const template of mask) {
        const digits = '2'.repeat(template.split('#').length - 1);
        const withoutCode = formatPhone(digits, id, { code: false });
        const international = formatPhone(`${code}${digits}`, id);
        expect(withoutCode.replace(/\D/g, ''), id).toBe(digits);
        expect(withoutCode, id).toMatch(/^\d+( \d+)*$/);
        expect(international, id).toBe(`${code} ${withoutCode}`);
        expect(formatPhone(withoutCode, id), id).toBe(international);
        expect(formatPhone(international, id, { code: false }), id).toBe(withoutCode);
        expect(formatPhone(digits, id, { flag: true }), id).toBe(`${flag} ${international}`);
      }
    }
  });
});
