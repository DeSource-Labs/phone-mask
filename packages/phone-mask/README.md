# @desource/phone-mask

> Core TypeScript library for international phone number masking with Google's libphonenumber data

[![npm version](https://img.shields.io/npm/v/@desource/phone-mask?color=blue&logo=npm)](https://www.npmjs.com/package/@desource/phone-mask)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@desource/phone-mask?label=gzip%20size&color=purple)](https://bundlephobia.com/package/@desource/phone-mask)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/DeSource-Labs/phone-mask/blob/main/LICENSE)

Framework-agnostic phone masking library that stays up-to-date with Google's libphonenumber database.

## ✨ Features

- 🌍 **240+ countries** with accurate masks and dialing codes
- 🔄 **Auto-synced** from Google's libphonenumber
- 🪶 **Tiny** — 13 KB minified, 4 KB gzipped
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
// "+1 ###-###-####"

// Format digits
const result = formatDigitsWithMap(prefixUsMask, '2025551234');
console.log(result.display); // "+1 202-555-1234"
console.log(result.map); // [-1, -1, -1, 0, 1, 2, -1, 3, 4, 5, -1, 6, 7, 8, 9]

// Get US mask without country code prefix
const usMask = MasksMap.US.mask;
// "###-###-####"

// Format digits without country code
const resultNoCode = formatDigitsWithMap(usMask, '2025551234');
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
console.log(us.mask); // "###-###-####"
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
import {
  toArray,
  countPlaceholders,
  removeCountryCodePrefix,
  pickMaskVariant,
  extractDigits
} from '@desource/phone-mask';

// Ensure mask is an array
const masks = toArray('+1 ###-###-####');
// ["+1 ###-###-####"]

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

## 📖 API Reference

### Types

```ts
// Country ISO 3166-1 alpha-2 code
type CountryKey = 'US' | 'GB' | 'DE' | ... // 240+ countries

// Mask interfaces
interface MaskBase {
  id: CountryKey;
  mask: string | Array<string>;
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
type MaskBaseMap = Record<CountryKey, string | Array<string>>;
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
// Convert single mask or array to array
function toArray<T>(value: T | T[]): T[];

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
  const mask = country?.mask;
  if (!mask) return value;

  const template = Array.isArray(mask) ? mask[0] : mask;
  const digits = extractDigits(value);

  return `${country.code} ${formatDigitsWithMap(template, digits).display}`;
}

// Usage
const formatted = formatPhoneInput('2025551234', 'US');
// "+1 202-555-1234"
```

### Phone Number Validation

```ts
import { MasksFullMapEn, countPlaceholders, toArray } from '@desource/phone-mask';

function isValidPhoneLength(digits: string, country: string): boolean {
  const mask = MasksFullMapEn[country]?.mask;
  if (!mask) return false;

  const masks = toArray(mask);
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
  return Object.entries(MasksFullEn).map((data) => ({
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

## 📊 Bundle Size

| Export              | Size (minified) | Gzipped |
| ------------------- | --------------- | ------- |
| Full library        | 13 KB           | 4 KB    |
| MasksFullMapEn only | 8 KB            | 3 KB    |
| Utilities only      | 2 KB            | 1 KB    |

All exports are tree-shakeable — only import what you use!

## 🔗 Related Packages

- [@desource/phone-mask-vue](../phone-mask-vue) — Vue 3 component + directive
- [@desource/phone-mask-nuxt](../phone-mask-nuxt) — Nuxt module

## 📄 License

[MIT](../../LICENSE) © 2025 DeSource Labs

## 🤝 Contributing

See [Contributing Guide](../../CONTRIBUTING.md)

---

<div align="center">
  <sub>Made with ❤️ by <a href="https://github.com/DeSource-Labs">DeSource Labs</a></sub>
</div>
