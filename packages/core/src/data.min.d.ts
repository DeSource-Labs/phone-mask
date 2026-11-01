import type { CountryKey } from './data-types.js';

export declare const masks: string[];
export declare const defaultCountryByCallingCode: Record<string, CountryKey>;

declare const countries: Record<CountryKey, string>;
export default countries;
