// @ts-expect-error -- Generated JavaScript data
import countries, { masks, defaultCountryByCallingCode } from './data.min.js';
import type { CountryKey } from './data-types.js';

/** Detect a complete international number from mask shape, then length. Shared matches use the main region. */
export function detectCountryFromPhone(value: string): CountryKey | undefined {
  const text = value.trim().replace(/\s+/g, ' ');
  if (!/^\+\d[\d ().-]*$/.test(text)) return;

  let callingCode = '';
  let exact: CountryKey[] = [];
  let lengths: CountryKey[] = [];

  for (const country of Object.keys(countries) as CountryKey[]) {
    const [code, ...indices] = countries[country].split('|');
    if (code.length < callingCode.length || !text.startsWith(`+${code}`)) continue;
    if (code.length > callingCode.length) {
      callingCode = code;
      exact = [];
      lengths = [];
    }

    const number = text.slice(code.length + 1).trim();
    const shape = number.replace(/\d/g, '#');
    const digitCount = number.replace(/\D/g, '').length;
    if (/\D/.test(number) && indices.some((index: string) => masks[index] === shape)) exact.push(country);
    if (indices.some((index: string) => masks[index].split('#').length - 1 === digitCount)) lengths.push(country);
  }

  const matches = exact.length ? exact : lengths;
  if (matches.length < 2) return matches[0];
  const fallback: CountryKey = defaultCountryByCallingCode[callingCode];
  return matches.includes(fallback) ? fallback : undefined;
}
