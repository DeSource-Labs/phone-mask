# @desource/phone-mask-react

> React phone input component and hook with smart masking and Google libphonenumber data

[![npm version](https://img.shields.io/npm/v/@desource/phone-mask-react?color=blue&logo=react)](https://www.npmjs.com/package/@desource/phone-mask-react)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@desource/phone-mask-react?label=gzip%20size&color=purple)](https://bundlephobia.com/package/@desource/phone-mask-react)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/DeSource-Labs/phone-mask/blob/main/LICENSE)

Beautiful, accessible, extreme small & tree-shackable React phone input with auto-formatting, country selector, and validation.

## ✨ Features

- 🎨 **Beautiful UI** — Modern design with light/dark themes
- 🔍 **Smart Country Search** — Fuzzy matching with keyboard navigation
- 🎭 **Auto-formatting** — As-you-type formatting with smart cursor
- ✅ **Validation** — Built-in validation with visual feedback
- 📋 **Copy Button** — One-click copy to clipboard
- 🌐 **Auto-detection** — GeoIP and locale-based detection
- ♿ **Accessible** — ARIA labels, keyboard navigation
- 📱 **Mobile-friendly** — Optimized for touch devices
- 🎯 **TypeScript** — Full type safety
- 🪝 **Hook API** — For custom input implementations
- ⚡ **Optimized** — Tree-shaking and code splitting

## 📦 Installation

```bash
npm install @desource/phone-mask-react
# or
yarn add @desource/phone-mask-react
# or
pnpm add @desource/phone-mask-react
```

## 🚀 Quick Start

### Importing

Component mode:
```tsx
import { PhoneInput } from '@desource/phone-mask-react';
import '@desource/phone-mask-react/assets/lib.css'; // Import styles
```

Hook mode:
```tsx
import { usePhoneMask } from '@desource/phone-mask-react';
```

### Component Mode

```tsx
import { useState } from 'react';
import { PhoneInput } from '@desource/phone-mask-react';
import '@desource/phone-mask-react/assets/lib.css'; // Import styles

function App() {
  const [phone, setPhone] = useState('');
  const [isValid, setIsValid] = useState(false);

  return (
    <>
      <PhoneInput
        value={phone}
        onChange={(data) => setPhone(data.digits)}
        onValidationChange={setIsValid}
        country="US"
      />

      {isValid && <p>✓ Valid phone number</p>}
    </>
  );
}
```

### Hook Mode

For custom input implementations:

```tsx
import { usePhoneMask } from '@desource/phone-mask-react';

function CustomPhoneInput() {
  const { ref, digits, full, fullFormatted, isComplete, country, setCountry } = usePhoneMask({
    country: 'US',
    detect: true,
    onChange: (phone) => {
      console.log(phone.full, phone.digits);
    }
  });

  return (
    <div>
      <input ref={ref} type="tel" placeholder="Phone number" />
      <p>Formatted: {fullFormatted}</p>
      <p>Valid: {isComplete ? 'Yes' : 'No'}</p>
      <p>Country: {country.name}</p>
      <button onClick={() => setCountry('GB')}>Use UK</button>
    </div>
  );
}
```

## 📖 Component API

### Props

```ts
interface PhoneInputProps {
  // Controlled value (digits only)
  value?: string;

  // Value change callback
  onChange?: (value: PhoneNumber) => void;

  // Country change callback
  onCountryChange?: (country: MaskFull) => void;

  // Validation state changed
  onValidationChange?: (isValid: boolean) => void;

  // Preselected country (ISO 3166-1 alpha-2)
  country?: CountryKey;

  // Auto-detect country from IP/locale
  detect?: boolean; // Default: true

  // Locale for country names
  locale?: string; // Default: browser language

  // Size variant
  size?: 'compact' | 'normal' | 'large'; // Default: 'normal'

  // Visual theme ("auto" | "light" | "dark")
  theme?: 'auto' | 'light' | 'dark'; // Default: 'auto'

  // Disabled state
  disabled?: boolean; // Default: false

  // Readonly state
  readonly?: boolean; // Default: false

  // Show copy button
  showCopy?: boolean; // Default: true

  // Show clear button
  showClear?: boolean; // Default: false

  // Show validation state (borders & outline)
  withValidity?: boolean; // Default: true

  // Custom search placeholder
  searchPlaceholder?: string; // Default: 'Search country or code...'

  // Custom no results text
  noResultsText?: string; // Default: 'No countries found'

  // Custom clear button label
  clearButtonLabel?: string; // Default: 'Clear phone number'

  // Dropdown menu custom CSS class
  dropdownClass?: string;

  // Disable default styles
  disableDefaultStyles?: boolean; // Default: false
}
```

### Events

```ts
interface PhoneInputEvents {
  // Value changed
  // Provides an object with:
  // - full: Full phone number with country code (e.g. +1234567890)
  // - fullFormatted: Full phone number formatted according to country rules (e.g. +1 234-567-890)
  // - digits: Only the digits of the phone number without country code (e.g. 234567890)
  onChange: (value: PhoneNumber) => void;

  // Country changed
  onCountryChange: (country: MaskFull) => void;

  // Validation state changed
  onValidationChange: (isValid: boolean) => void;
}
```

### Ref Methods

```tsx
const phoneInputRef = useRef<PhoneInputRef>(null);

phoneInputRef.current?.focus();
phoneInputRef.current?.blur();
phoneInputRef.current?.clear();
phoneInputRef.current?.selectCountry('GB');
phoneInputRef.current?.getFullNumber();
phoneInputRef.current?.getFullFormattedNumber();
phoneInputRef.current?.getDigits();
phoneInputRef.current?.isValid();
phoneInputRef.current?.isComplete();
```

## 🪝 Hook API

### Options

```ts
interface UsePhoneMaskOptions {
  // Predefined country ISO code (e.g., 'US', 'DE', 'GB')
  country?: string;

  // Locale for country names (default: navigator.language)
  locale?: string;

  // Auto-detect country from IP/locale (default: false)
  detect?: boolean;

  // Value change callback
  onChange?: (phone: PhoneNumber) => void;

  // Country change callback
  onCountryChange?: (country: MaskFull) => void;
}
```

### Return Value

```ts
interface UsePhoneMaskReturn {
  ref: RefObject<HTMLInputElement>;
  digits: string;
  full: string;
  fullFormatted: string;
  isComplete: boolean;
  isEmpty: boolean;
  shouldShowWarn: boolean;
  country: MaskFull;
  setCountry: (code: string) => void;
  clear: () => void;
}
```

## 🎨 Component Styling

### CSS Custom Properties

Customize colors via CSS variables:

```css
.phone-input,
.phone-dropdown {
  /* Colors */
  --pi-bg: #ffffff;
  --pi-fg: #111827;
  --pi-muted: #6b7280;
  --pi-border: #e5e7eb;
  --pi-border-hover: #d1d5db;
  --pi-border-focus: #3b82f6;
  --pi-focus-ring: 3px solid rgb(59 130 246 / 0.15);
  --pi-disabled-bg: #f9fafb;
  --pi-disabled-fg: #9ca3af;
  /* Sizes */
  --pi-font-size: 16px;
  --pi-height: 44px;
  /* Spacing */
  --pi-padding: 12px;
  /* Border radius */
  --pi-radius: 8px;
  /* Shadows */
  --pi-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --pi-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
  /* Validation */
  --pi-warning: #f59e0b;
  --pi-warning-light: #fbbf24;
  --pi-success: #10b981;
  --pi-focus-ring-warning: 3px solid rgb(245 158 11 / 0.15);
  --pi-focus-ring-success: 3px solid rgb(16 185 129 / 0.15);
}
```

### Dark Theme

```tsx
<PhoneInput value={phone} theme="dark" />
```

Or with CSS:

```css
.phone-input[data-theme='dark'] {
  --pi-bg: #1f2937;
  --pi-fg: #f9fafb;
  --pi-border: #374151;
}
```

## 📚 Examples

### With Validation

```tsx
import { useState } from 'react';
import { PhoneInput } from '@desource/phone-mask-react';

function Example() {
  const [phone, setPhone] = useState('');
  const [isValid, setIsValid] = useState(false);

  return (
    <div>
      <PhoneInput value={phone} onChange={(data) => setPhone(data.digits)} onValidationChange={setIsValid} />

      {isValid && <span>✓ Valid phone number</span>}
    </div>
  );
}
```

### Auto-detect Country

```tsx
import { useState } from 'react';
import { PhoneInput } from '@desource/phone-mask-react';

function Example() {
  const [phone, setPhone] = useState('');
  const [detectedCountry, setDetectedCountry] = useState('');

  return (
    <>
      <PhoneInput
        value={phone}
        detect
        onChange={(data) => setPhone(data.digits)}
        onCountryChange={(country) => setDetectedCountry(country.name)}
      />

      {detectedCountry && <p>Detected: {detectedCountry}</p>}
    </>
  );
}
```

### With Form Libraries

#### React Hook Form

```tsx
import { useForm, Controller } from 'react-hook-form';
import { PhoneInput } from '@desource/phone-mask-react';

function Example() {
  const { control } = useForm({
    defaultValues: { phone: '' }
  });

  return (
    <Controller
      name="phone"
      control={control}
      render={({ field }) => (
        <PhoneInput
          value={field.value}
          onChange={(data) => field.onChange(data.digits)}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}
```

### Multiple Inputs

```tsx
import { useState } from 'react';
import { PhoneInput } from '@desource/phone-mask-react';

function Example() {
  const [form, setForm] = useState({ mobile: '', home: '', work: '' });

  return (
    <div className="form">
      <label>
        Mobile
        <PhoneInput value={form.mobile} onChange={(data) => setForm({ ...form, mobile: data.digits })} />
      </label>

      <label>
        Home
        <PhoneInput value={form.home} onChange={(data) => setForm({ ...form, home: data.digits })} />
      </label>

      <label>
        Work
        <PhoneInput value={form.work} onChange={(data) => setForm({ ...form, work: data.digits })} />
      </label>
    </div>
  );
}
```

## 🎯 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Chrome Mobile

## 📦 What's Included

```
@desource/phone-mask-react/
├── dist/
│   ├── esm                     # ESM bundle + types
│   ├── phone-mask-react.cjs.js # CommonJS bundle
│   └── phone-mask-react.css    # Component styles
├── README.md                   # This file
└── package.json                # Package manifest
```

## 🔗 Related

- [@desource/phone-mask](../phone-mask) — Core library
- [@desource/phone-mask-nuxt](../phone-mask-nuxt) — Nuxt module
- [@desource/phone-mask-vue](../phone-mask-vue) — Vue 3 bindings

## 📄 License

[MIT](../../LICENSE) © 2026 DeSource Labs

## 🤝 Contributing

See [Contributing Guide](../../CONTRIBUTING.md)

---

<div align="center">
  <sub>Made with ❤️ by <a href="https://github.com/DeSource-Labs">DeSource Labs</a></sub>
</div>
