import { detectCountryFromPhone } from '@src/country-detection';
import { detectCountryFromPhone as kitDetect } from '@src/kit';
import countries, { defaultCountryByCallingCode } from '@src/data.min.js';
import data from '@src/data.json';

describe('detectCountryFromPhone', () => {
  it.each([
    ['+7 123 456-77-88', 'RU'],
    ['+7 12345 6 77 88', 'KZ'],
    ['+7 123 456 7788', 'KZ'],
    ['+71234567788', 'RU'],
    ['+7 1234567788', 'RU'],
    ['+712345 6 77 88', 'KZ'],
    [' \t+7\u00a012345  6\t77 88\n', 'KZ'],
    ['+7 (123) 456-77-88', 'RU'],
    ['+7 12 3456 7788', 'RU'],
    ['+7 123 456 77 88', 'RU'],
    ['+1 416-555-1234', 'US'],
    ['+14165551234', 'US'],
    ['+2901234', 'TA'],
    ['+29012345', 'SH'],
    ['+599 123 4567', 'CW'],
    ['+59912345678', 'CW'],
    ['+61 12 345 67', 'AU'],
    ['+611234567', 'AU'],
    ['+61 123 456 789', 'AU'],
    ['+358 12 3456789', 'FI'],
    ['+590 123 45 67 89', 'GP'],
    ['+212 1 23 45 67 89', 'MA'],
    ['+44 1234 567890', 'GB'],
    ['+39 06 1234 5678', 'IT'],
    ['+47 12 34 56 78', 'NO'],
    ['+262 123 45 67 89', 'RE'],
    ['+33 1 23 45 67 89', 'FR'],
    ['+687 12.34.56', 'NC'],
    ['+4915123456789', 'DE']
  ])('detects %s as %s using only current masks', (value, expected) => {
    expect(detectCountryFromPhone(value)).toBe(expected);
  });

  it.each([
    '',
    ' ',
    '+',
    '+7',
    '+7 ()-.',
    '+7123',
    '+712345677889',
    '+99912345678',
    '71234567788',
    '0071234567788',
    '01171234567788',
    '+ 71234567788',
    '++71234567788',
    '+7 123+4567788',
    '+7 123 456-77-88 ext. 9',
    'tel:+71234567788',
    '+1 800 FLOWERS',
    '+7 １２３４５６７７８８',
    '+71234567788\n+14165551234'
  ])('leaves unsupported or incomplete input unresolved: %j', (value) => {
    expect(detectCountryFromPhone(value)).toBeUndefined();
  });

  it('exports the detector from kit', () => {
    expect(kitDetect).toBe(detectCountryFromPhone);
  });

  it('never selects a default outside the matching countries', () => {
    const previous = defaultCountryByCallingCode['7'];
    try {
      defaultCountryByCallingCode['7'] = 'US';
      expect(detectCountryFromPhone('+71234567788')).toBeUndefined();
      expect(detectCountryFromPhone('+7 12345 6 77 88')).toBe('KZ');
    } finally {
      defaultCountryByCallingCode['7'] = previous;
    }
  });

  it('generates defaults only for shared calling codes and keeps each default in its group', () => {
    const groups: Record<string, string[]> = {};
    for (const [country, row] of Object.entries(countries)) {
      const code = row.split('|')[0];
      (groups[code] ??= []).push(country);
    }
    const sharedCodes = Object.keys(groups).filter((code) => groups[code].length > 1);
    expect(Object.keys(defaultCountryByCallingCode).sort()).toEqual(sharedCodes.sort());
    for (const [code, country] of Object.entries(defaultCountryByCallingCode)) {
      expect(groups[code]).toContain(country);
    }
  });

  it('resolves every generated mask to a country sharing its calling code and complete length', () => {
    for (const templates of Object.values(data)) {
      for (const template of [templates].flat()) {
        for (const input of [template.replace(/#/g, '2'), template.replace(/#/g, '2').replace(/[^\d+]/g, '')]) {
          const detected = detectCountryFromPhone(input);
          expect(detected, input).toBeDefined();
          const matching = [data[detected!]].flat();
          const code = template.split(' ')[0];
          const count = template.split('#').length - 1;
          expect(
            matching.some((mask) => mask.startsWith(`${code} `) && mask.split('#').length - 1 === count),
            input
          ).toBe(true);
        }
      }
    }
  });
});
