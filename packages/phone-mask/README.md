# @desource/phone-mask

> Core TypeScript library for international phone number masking with Google's libphonenumber data

[![npm version](https://img.shields.io/npm/v/@desource/phone-mask?color=blue&logo=npm)](https://www.npmjs.com/package/@desource/phone-mask)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@desource/phone-mask?label=gzip%20size&color=purple)](https://bundlephobia.com/package/@desource/phone-mask)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/DeSource-Labs/phone-mask/blob/main/LICENSE)

Framework-agnostic phone masking library that stays up-to-date with Google's libphonenumber database.

## ✨ Features

- 🌍 **240+ countries** with accurate masks and dialing codes
- 🔄 **Auto-synced** from Google's libphonenumber
- 🪶 **Tiny** — 11.2 KB minified, 5.1 KB gzipped
- 🌳 **Tree-shakeable** — import only what you need
- 🔧 **TypeScript** — fully typed
- 🎯 **Zero dependencies**

## 📦 Installation

```bash
npm install @desource/phone-mask
# or
yarn add @desource/phone-mask
# or
pnpm add @desource/phone-mask
```

## 🚀 Quick Start

### Basic Formatting

```ts
import { MasksBaseMap, MasksMap, formatDigitsWithMap } from '@desource/phone-mask';

// Get US mask with country code prefix
const prefixUsMask = MasksBaseMap.US;
// ["+1 ###-###-####"]

// Format digits
const result = formatDigitsWithMap(prefixUsMask[0], '2025551234');
console.log(result.display); // "+1 202-555-1234"
console.log(result.map); // [-1, -1, -1, 0, 1, 2, -1, 3, 4, 5, -1, 6, 7, 8, 9]

// Get US mask without country code prefix
const usMask = MasksMap.US.mask;
// ["###-###-####"]

// Format digits without country code
const resultNoCode = formatDigitsWithMap(usMask[0], '2025551234');
console.log(resultNoCode.display); // "202-555-1234"
console.log(resultNoCode.map); // [0, 1, 2, -1, 3, 4, 5, -1, 6, 7, 8, 9]
```

### Working with Country Data

```ts
import { MasksFullMapEn, type MaskFull } from '@desource/phone-mask';

// Access country data
const us = MasksFullMapEn.US;

console.log(us.name); // "United States"
console.log(us.code); // "+1"
console.log(us.mask); // ["###-###-####"]
console.log(us.flag); // "🇺🇸"
```

### Multiple Mask Variants

Some countries have multiple mask formats:

```ts
import { MasksFullMapEn } from '@desource/phone-mask';

const gb = MasksFullMapEn.GB;
console.log(gb.mask);
// [
//   "### ### ####",
//   "#### ######",
//   "## #### ####"
// ]
```

### Localized Country Names

```ts
import { MasksFullMap } from '@desource/phone-mask';

// Get localized names
const germanMap = MasksFullMap('de');
console.log(germanMap.US.name); // "Vereinigte Staaten"

const frenchMap = MasksFullMap('fr');
console.log(frenchMap.US.name); // "États-Unis"
```

### Utility Functions

```ts
import { countPlaceholders, removeCountryCodePrefix, pickMaskVariant, extractDigits } from '@desource/phone-mask';

// Count placeholder digits
const count = countPlaceholders('+1 ###-###-####');
// 10

// Remove country code prefix
const stripped = removeCountryCodePrefix('+1 ###-###-####');
// "###-###-####"

// Pick best mask variant for digit count
const variants = ['+44 ### ### ####', '+44 #### ######'];
const best = pickMaskVariant(variants, 11);
// "+44 #### ######"

// Extract only digits from string
const digits = extractDigits('+1 (202) 555-1234');
// "12025551234"
```

### Validate Number Against Country Rules

Use `createPhoneFormatter()` to validate length against a specific country's mask variants.

```ts
import { MasksFullMapEn, createPhoneFormatter, extractDigits, type CountryKey } from '@desource/phone-mask';

function validateForCountry(input: string, countryId: CountryKey) {
  const country = MasksFullMapEn[countryId];
  if (!country) {
    return {
      digits: '',
      display: '',
      isComplete: false
    };
  }

  const formatter = createPhoneFormatter(country);
  const digits = extractDigits(input, formatter.getMaxDigits());

  return {
    digits,
    display: formatter.formatDisplay(digits),
    isComplete: formatter.isComplete(digits)
  };
}

validateForCountry('+1 (202) 555-1234', 'US');
// { digits: "2025551234", display: "202-555-1234", isComplete: true }
```

### Raw Digits for Backend Processing

Use raw digits for storage and transport. Keep formatting on the client only.

```ts
import { MasksFullMapEn, extractDigits, type CountryKey } from '@desource/phone-mask';

function buildPhonePayload(input: string, countryId: CountryKey) {
  const country = MasksFullMapEn[countryId];
  if (!country) return null;

  const localDigits = extractDigits(input);

  return {
    country: countryId,
    phoneDigits: localDigits, // canonical backend field
    phoneE164: `${country.code}${localDigits}` // optional: with dialing prefix
  };
}
```

### Custom Regex + Metadata (Regional/Carrier Prefixes)

Combine Phone Mask metadata with region-specific regex rules:

```ts
import { MasksFullMapEn, createPhoneFormatter, extractDigits, type CountryKey } from '@desource/phone-mask';

const tenantCarrierRules: Partial<Record<CountryKey, RegExp>> = {
  BR: /^(11|21|31)\d{8,9}$/,
  IN: /^(98|99)\d{8}$/
};

function validateWithCarrierRule(input: string, countryId: CountryKey): boolean {
  const country = MasksFullMapEn[countryId];
  if (!country) return false;

  const formatter = createPhoneFormatter(country);
  const digits = extractDigits(input, formatter.getMaxDigits());
  const carrierRule = tenantCarrierRules[countryId];

  if (!formatter.isComplete(digits)) return false;
  return carrierRule ? carrierRule.test(digits) : true;
}
```

### Multi-tenant: tenantId Default Country + Tenant-specific Validation Rules

```ts
import { MasksFullMapEn, createPhoneFormatter, extractDigits, type CountryKey } from '@desource/phone-mask';

type TenantPolicy = {
  defaultCountry: CountryKey;
  prefixRule?: RegExp;
};

const TENANT_POLICIES: Record<string, TenantPolicy> = {
  acme: { defaultCountry: 'US', prefixRule: /^(202|303)\d{7}$/ },
  globex: { defaultCountry: 'GB', prefixRule: /^7\d{9}$/ }
};

function createTenantPhoneService(tenantId: string) {
  const policy = TENANT_POLICIES[tenantId] ?? { defaultCountry: 'US' as const };
  const country = MasksFullMapEn[policy.defaultCountry];
  const formatter = createPhoneFormatter(country);

  return {
    defaultCountry: policy.defaultCountry,
    format(input: string) {
      const digits = extractDigits(input, formatter.getMaxDigits());
      return formatter.formatDisplay(digits);
    },
    validate(input: string) {
      const digits = extractDigits(input, formatter.getMaxDigits());
      const complete = formatter.isComplete(digits);
      const prefixOk = policy.prefixRule ? policy.prefixRule.test(digits) : true;
      return complete && prefixOk;
    }
  };
}
```

## 📖 API Reference

### Types

```ts
// Country ISO 3166-1 alpha-2 code
type CountryKey = 'US' | 'GB' | 'DE' | ... // 240+ countries

// Mask interfaces
interface MaskBase {
  id: CountryKey;
  mask: Array<string>;
}
interface Mask extends MaskBase {
  code: string;
}
interface MaskWithFlag extends Mask {
  flag: string;
}
interface MaskFull extends MaskWithFlag {
  name: string;
}
type MaskBaseMap = Record<CountryKey, Array<string>>;
type MaskMap = Record<CountryKey, Omit<Mask, 'id'>>;
type MaskWithFlagMap = Record<CountryKey, Omit<MaskWithFlag, 'id'>>;
type MaskFullMap = Record<CountryKey, Omit<MaskFull, 'id'>>;
```

### Core Exports

#### `MasksBaseMap` & `MasksBase`

Basic country masks including country code prefix (lightweight version):

```ts
const MasksBaseMap: MaskBaseMap;
const MasksBase: MaskBase[];
```

Use these to get raw masks with country code prefix.
**Note:** some helper functions may expect masks without country code.

#### `MasksMap` & `Masks`

Masks with country code as separate property:

```ts
const MasksMap: MaskMap;
const Masks: Mask[];
```

#### `MasksWithFlagMap` & `MasksWithFlag`

Masks with country code and flag:

```ts
const MasksWithFlagMap: MaskWithFlagMap;
const MasksWithFlag: MaskWithFlag[];
```

#### `MasksFullMapEn` & `MasksFullEn`

Full country data with country names in English:

```ts
const MasksFullMapEn: MaskFullMap;
const MasksFullEn: MaskFull[];
```

#### `MasksFullMap(locale: string)` & `MasksFull(locale: string)`

Get full country data with localized country names:

```ts
function MasksFullMap(locale: string): MaskFullMap;
function MasksFull(locale: string): MaskFull[];
```

**Supported locales**: `en`, `de`, `fr`, `es`, `it`, `pt`, `ru`, `zh`, `ja`, `ko`, and more.

#### Utility Functions

```ts
// Count # placeholders in mask
function countPlaceholders(mask: string): number;

// Remove country code prefix from mask
function removeCountryCodePrefix(mask: string): string;

// Pick best mask variant for digit length
function pickMaskVariant(masks: string[], digitLength: number): string;

// Extract digits from any string
function extractDigits(value: string, maxLength?: number): string;

// Format digits according to template
function formatDigitsWithMap(value: string, digits: string): { display: string; map: number[] };

// Get flag emoji for country code
function getFlagEmoji(countryCode: CountryKey): string;
```

## 🎯 Use Cases

### Custom Input Formatting

```ts
import { MasksFullMapEn, formatDigitsWithMap, extractDigits } from '@desource/phone-mask';

function formatPhoneInput(value: string, countryCode: string = 'US') {
  const country = MasksFullMapEn[countryCode];
  const mask = country?.mask[0];
  if (!mask) return value;

  const digits = extractDigits(value);

  return `${country.code} ${formatDigitsWithMap(mask, digits).display}`;
}

// Usage
const formatted = formatPhoneInput('2025551234', 'US');
// "+1 202-555-1234"
```

### Phone Number Validation

```ts
import { MasksFullMapEn, countPlaceholders } from '@desource/phone-mask';

function isValidPhoneLength(digits: string, country: string): boolean {
  const masks = MasksFullMapEn[country]?.mask;
  if (!masks) return false;
  const validLengths = masks.map((m) => countPlaceholders(m));

  return validLengths.includes(digits.length);
}

// Usage
isValidPhoneLength('2025551234', 'US'); // true (10 digits)
isValidPhoneLength('202555', 'US'); // false (too short)
```

### Building a Country Selector

```ts
import { MasksFullEn, type CountryKey, type MaskFull } from '@desource/phone-mask';

type CountryOption = Omit<MaskFull, 'mask'>;

function getCountryOptions(): CountryOption[] {
  return MasksFullEn.map((data) => ({
    id: data.id,
    name: data.name,
    code: data.code,
    flag: data.flag
  }));
}

// Usage
const countries = getCountryOptions();
// [
//   { id: 'US', name: 'United States', code: '+1', flag: '🇺🇸' },
//   { id: 'GB', name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
//   ...
// ]
```

### Getting Flag Emojis

```ts
import { getFlagEmoji } from '@desource/phone-mask';

// Get flag emoji for country code
const flag = getFlagEmoji('US'); // "🇺🇸"
```

## 🔄 Data Updates

The library syncs with [Google's libphonenumber](https://github.com/google/libphonenumber) weekly via automated workflow. To update manually:

```bash
pnpm gen
```

This fetches the latest data and regenerates `data.json`.
This updates generated metadata files used by the package (`src/data.json`, `src/data.min.js`, and `src/data-types.ts`).

## 📊 Bundle Size

Measured in a real consumer bundle:

| Export              | Size (minified) | Gzipped |  Brotli |
| ------------------- | --------------: | ------: | ------: |
| Full library        |        11.20 KB | 5.10 KB | 4.39 KB |
| MasksFullMapEn only |         5.77 KB | 2.68 KB | 2.17 KB |
| Utilities only      |         0.44 KB | 0.32 KB | 0.27 KB |

All exports are tree-shakeable — only import what you use!

## 🔗 Related Packages

- [@desource/phone-mask-vue](../phone-mask-vue) — Vue 3 component + composable + directive
- [@desource/phone-mask-nuxt](../phone-mask-nuxt) — Nuxt module
- [@desource/phone-mask-react](../phone-mask-react) — React component + hook
- [@desource/phone-mask-svelte](../phone-mask-svelte) — Svelte component + composable + action + attachment

## 📄 License

[MIT](../../LICENSE) © 2026 DeSource Labs

## 🤝 Contributing

See [Contributing Guide](../../CONTRIBUTING.md)

---

<div align="center">
  <sub>Made with ❤️ by <a href="https://github.com/DeSource-Labs">DeSource Labs</a></sub>
</div>
