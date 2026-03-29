# @desource/phone-mask-svelte

> Svelte 5 phone input component with Google's libphonenumber data

[![npm version](https://img.shields.io/npm/v/@desource/phone-mask-svelte?color=blue&logo=svelte)](https://www.npmjs.com/package/@desource/phone-mask-svelte)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@desource/phone-mask-svelte?label=gzip%20size&color=purple)](https://bundlephobia.com/package/@desource/phone-mask-svelte)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/DeSource-Labs/phone-mask/blob/main/LICENSE)

Beautiful, accessible, extreme small & tree-shakeable Svelte 5 phone input with auto-formatting, country selector, and validation.

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
- 🧩 **Four modes** — Component, composable, attachment, or action
- ⚡ **Optimized** — Tree-shaking and code splitting

## 📦 Installation

```bash
npm install @desource/phone-mask-svelte
# or
yarn add @desource/phone-mask-svelte
# or
pnpm add @desource/phone-mask-svelte
```

## 🚀 Quick Start

### Importing

Component mode:

```ts
import { PhoneInput } from '@desource/phone-mask-svelte';
import '@desource/phone-mask-svelte/assets/lib.css'; // Import styles
```

Composable mode:

```ts
import { usePhoneMask } from '@desource/phone-mask-svelte';
```

Core helpers (direct re-exports from `@desource/phone-mask`):

```ts
import { getFlagEmoji, formatDigitsWithMap } from '@desource/phone-mask-svelte/core';
```

Attachment mode (for existing `<input>` elements, requires Svelte 5.29+):

```ts
import { phoneMaskAttachment as phoneMask } from '@desource/phone-mask-svelte';
```

Action mode (for existing `<input>` elements, works with all Svelte 5 versions):

```ts
import { phoneMaskAction as phoneMask } from '@desource/phone-mask-svelte';
```

### Component Mode

```svelte
<script lang="ts">
  import { PhoneInput } from '@desource/phone-mask-svelte';
  import '@desource/phone-mask-svelte/assets/lib.css';

  let phone = $state('');
  let isValid = $state(false);
</script>

<PhoneInput bind:value={phone} country="US" onvalidationchange={(v) => (isValid = v)} />

{#if isValid}
  <p>✓ Valid phone number</p>
{/if}
```

### Composable Mode

For custom input implementations:

```svelte
<script lang="ts">
  import { usePhoneMask } from '@desource/phone-mask-svelte';

  let value = $state('');

  const phoneMask = usePhoneMask({
    value: () => value,
    onChange: (digits) => (value = digits),
    country: () => 'US',
    detect: () => false
  });
</script>

<div>
  <input bind:this={phoneMask.inputRef} type="tel" placeholder="Phone number" />
  <p>Formatted: {phoneMask.fullFormatted}</p>
  <p>Valid: {phoneMask.isComplete ? 'Yes' : 'No'}</p>
  <p>Country: {phoneMask.country.name}</p>
  <button onclick={() => phoneMask.setCountry('GB')}>Use UK</button>
</div>
```

### Attachment Mode

For existing `<input>` elements without a wrapper component. Requires Svelte 5.29+.

```svelte
<script lang="ts">
  import { phoneMaskAttachment as phoneMask } from '@desource/phone-mask-svelte';
  import type { PMaskPhoneNumber, PMaskFull } from '@desource/phone-mask-svelte';

  let country = $state('US');

  function handleChange(phone: PMaskPhoneNumber) {
    console.log('Full:', phone.full, 'Digits:', phone.digits);
  }

  function handleCountryChange(c: PMaskFull) {
    console.log('Country:', c.name);
  }
</script>

<div class="phone-wrapper">
  <select bind:value={country}>
    <option value="US">🇺🇸 +1</option>
    <option value="GB">🇬🇧 +44</option>
    <option value="DE">🇩🇪 +49</option>
  </select>

  <input
    {@attach phoneMask({ country, onChange: handleChange, onCountryChange: handleCountryChange })}
    placeholder="Phone number"
  />
</div>
```

Shorthand (country code string):

```svelte
<input {@attach phoneMask('US')} />
```

With auto-detection:

```svelte
<input {@attach phoneMask({ detect: true, onChange: handleChange })} />
```

### Action Mode

For existing `<input>` elements without a wrapper component. Works with **all Svelte 5 versions** (including pre-5.29). Reactive parameter changes are applied through Svelte's `use:` action `update()` lifecycle hook.

```svelte
<script lang="ts">
  import { phoneMaskAction as phoneMask } from '@desource/phone-mask-svelte';
  import type { PMaskPhoneNumber, PMaskFull } from '@desource/phone-mask-svelte';

  let country = $state('US');

  function handleChange(phone: PMaskPhoneNumber) {
    console.log('Full:', phone.full, 'Digits:', phone.digits);
  }

  function handleCountryChange(c: PMaskFull) {
    console.log('Country:', c.name);
  }
</script>

<div class="phone-wrapper">
  <select bind:value={country}>
    <option value="US">🇺🇸 +1</option>
    <option value="GB">🇬🇧 +44</option>
    <option value="DE">🇩🇪 +49</option>
  </select>

  <input
    use:phoneMask={{ country, onChange: handleChange, onCountryChange: handleCountryChange }}
    placeholder="Phone number"
  />
</div>
```

Shorthand (country code string):

```svelte
<input use:phoneMask={'US'} />
```

With auto-detection:

```svelte
<input use:phoneMask={{ detect: true, onChange: handleChange }} />
```

## 📖 Component API

### Props

> **Note:** The component supports both controlled and bindable modes. Use `bind:value` for two-way binding or `value` + `onchange` for controlled mode.

```ts
interface PhoneInputProps {
  // Bindable value (digits only, without country code)
  value?: string;

  // Optional id/name applied to the underlying <input> for forms/autofill
  id?: string;
  name?: string;

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

  // Extra CSS class merged onto root element
  class?: string;

  // Callback when the phone number changes.
  // Provides an object with:
  // - full: Full phone number with country code (e.g. +1234567890)
  // - fullFormatted: Full phone number formatted according to country rules (e.g. +1 234-567-890)
  // - digits: Only the digits of the phone number without country code (e.g. 234567890)
  onchange?: (value: PhoneNumber) => void;

  // Callback when the selected country changes
  oncountrychange?: (country: MaskFull) => void;

  // Callback when the validation state changes
  onvalidationchange?: (isValid: boolean) => void;

  // Callback when the input is focused
  onfocus?: (event: FocusEvent) => void;

  // Callback when the input is blurred
  onblur?: (event: FocusEvent) => void;

  // Callback when phone number is copied
  oncopy?: (value: string) => void;

  // Callback when input is cleared
  onclear?: () => void;
}
```

### Exposed Methods

Access component methods via `bind:this`:

```svelte
<script lang="ts">
  import { PhoneInput } from '@desource/phone-mask-svelte';
  import type { PhoneInputExposed } from '@desource/phone-mask-svelte';

  let phoneInput = $state<PhoneInputExposed | null>(null);
</script>

<PhoneInput bind:this={phoneInput} />
<button onclick={() => phoneInput?.focus()}>Focus</button>
```

```ts
interface PhoneInputExposed {
  focus: () => void; // Focus the input
  blur: () => void; // Blur the input
  clear: () => void; // Clear the input value
  selectCountry: (code: string) => void; // Programmatically select a country by ISO code
  getFullNumber: () => string; // Returns full phone number with country code (e.g. +1234567890)
  getFullFormattedNumber: () => string; // Returns formatted number with country code (e.g. +1 234-567-890)
  getDigits: () => string; // Returns only digits without country code (e.g. 234567890)
  isValid: () => boolean; // Checks if the current phone number is valid
  isComplete: () => boolean; // Alias for isValid()
}
```

### Snippets

```svelte
<PhoneInput bind:value={phone}>
  {#snippet flag(country)}
    <img src="/flags/{country.code.toLowerCase()}.svg" alt={country.name} />
  {/snippet}

  {#snippet copysvg(copied)}
    {copied ? '✓' : '📋'}
  {/snippet}

  {#snippet clearsvg()}
    ✕
  {/snippet}

  {#snippet actionsbefore()}
    <button onclick={handleCustomAction}>Custom</button>
  {/snippet}
</PhoneInput>
```

| Snippet         | Props                    | Description                                       |
| --------------- | ------------------------ | ------------------------------------------------- |
| `flag`          | `MaskFull`               | Custom flag icon in the country list and selector |
| `copysvg`       | `boolean` (copied state) | Custom copy button icon                           |
| `clearsvg`      | —                        | Custom clear button icon                          |
| `actionsbefore` | —                        | Content rendered before default action buttons    |

## 🧩 Composable API

### Options

> **Note:** The composable uses getter functions for reactive options. Do NOT pass values directly.

```ts
interface UsePhoneMaskOptions {
  // Getter returning current digit value (controlled) - REQUIRED
  value: () => string;

  // Callback when the digits value changes - REQUIRED
  onChange: (digits: string) => void;

  // Getter for ISO country code (e.g., 'US', 'DE', 'GB')
  country?: () => string | undefined;

  // Getter for locale string (default: navigator.language)
  locale?: () => string | undefined;

  // Getter for auto-detect flag (default: false)
  detect?: () => boolean | undefined;

  // Callback when the phone changes (full, fullFormatted, digits)
  onPhoneChange?: (phone: PhoneNumber) => void;

  // Country change callback
  onCountryChange?: (country: MaskFull) => void;
}
```

### Return Value

> **Important:** Do NOT destructure the returned object — all properties are reactive getters and destructuring breaks reactivity.

```ts
interface UsePhoneMaskReturn {
  // Ref to attach to your input element
  inputRef: HTMLInputElement | null;

  // Raw digits without formatting (e.g., "1234567890")
  digits: string;

  // Phone formatter instance
  formatter: FormatterHelpers;

  // Full phone number with country code (e.g., "+11234567890")
  full: string;

  // Full phone number formatted (e.g., "+1 123-456-7890")
  fullFormatted: string;

  // Whether the phone number is complete
  isComplete: boolean;

  // Whether the input is empty
  isEmpty: boolean;

  // Whether to show validation warning
  shouldShowWarn: boolean;

  // Current country data
  country: MaskFull;

  // Current locale used for country names
  locale: string;

  // Change country programmatically
  setCountry: (countryCode?: string | null) => boolean;

  // Clear the input
  clear: () => void;
}
```

```svelte
<script lang="ts">
  // ✅ CORRECT — access as properties
  const phoneMask = usePhoneMask(options);
  phoneMask.digits;

  // ❌ WRONG — loses reactivity
  const { digits } = usePhoneMask(options);
</script>
```

## ⚡ Attachment API

The `phoneMaskAttachment` Svelte attachment (Svelte 5.29+) applies phone masking directly to any `<input>` element via `{@attach phoneMaskAttachment(...)}`. Unlike `use:` actions, the attachment factory re-runs reactively when reactive state in the call site changes — no manual `update()` needed.

### Basic Usage

```svelte
<script lang="ts">
  import { phoneMaskAttachment } from '@desource/phone-mask-svelte';
</script>

<input {@attach phoneMaskAttachment('US')} />
```

### Options

```ts
import type { PMaskFull, PMaskPhoneNumber } from '@desource/phone-mask-svelte';

interface PhoneMaskBindingOptions {
  // Predefined country ISO code (e.g., 'US', 'DE', 'GB')
  country?: string;

  // Locale for country names (default: navigator.language)
  locale?: string;

  // Auto-detect country from IP/locale (default: false)
  detect?: boolean;

  // Value change callback
  onChange?: (phone: PMaskPhoneNumber) => void;

  // Country change callback
  onCountryChange?: (country: PMaskFull) => void;
}
```

The parameter can be a country code string (shorthand) or an options object:

```svelte
<!-- Shorthand -->
<input {@attach phoneMaskAttachment('DE')} />

<!-- Full options -->
<input {@attach phoneMaskAttachment({ country: 'DE', onChange: handleChange })} />

<!-- Auto-detect -->
<input {@attach phoneMaskAttachment({ detect: true, onCountryChange: handleCountryChange })} />
```

### Reactive Country

Pass reactive state directly — the factory re-runs automatically when `selectedCountry` changes:

```svelte
<script lang="ts">
  import { phoneMaskAttachment as phoneMask } from '@desource/phone-mask-svelte';

  let selectedCountry = $state('US');
  let phoneData = $state<{ full: string; digits: string } | null>(null);
</script>

<select bind:value={selectedCountry}>
  <option value="US">🇺🇸 United States</option>
  <option value="GB">🇬🇧 United Kingdom</option>
  <option value="DE">🇩🇪 Germany</option>
</select>

<input
  {@attach phoneMask({ country: selectedCountry, onChange: (p) => (phoneData = p) })}
  placeholder="Phone number"
/>
```

## 🎬 Action API

The `phoneMaskAction` Svelte action applies phone masking directly to any `<input>` element via `use:phoneMaskAction`. It works with **all Svelte 5 versions** — no Svelte 5.29+ required.

When the bound parameter object changes (e.g. a new `country` value), Svelte automatically calls the action's `update()` hook, which re-applies the new options and switches the country if needed.

### Basic Usage

```svelte
<script lang="ts">
  import { phoneMaskAction } from '@desource/phone-mask-svelte';
</script>

<input use:phoneMaskAction={'US'} />
```

### Options

```ts
import type { PMaskFull, PMaskPhoneNumber } from '@desource/phone-mask-svelte';

interface PhoneMaskBindingOptions {
  // Predefined country ISO code (e.g., 'US', 'DE', 'GB')
  country?: string;

  // Locale for country names (default: navigator.language)
  locale?: string;

  // Auto-detect country from GeoIP on mount; falls back to locale detection
  detect?: boolean;

  // Value change callback — fires on every phone number change
  onChange?: (phone: PMaskPhoneNumber) => void;

  // Country change callback — fires on initial mount and on country switch
  onCountryChange?: (country: PMaskFull) => void;
}
```

The parameter can be a country code string (shorthand) or an options object:

```svelte
<!-- Shorthand -->
<input use:phoneMaskAction={'DE'} />

<!-- Full options -->
<input use:phoneMaskAction={{ country: 'DE', onChange: handleChange }} />

<!-- Auto-detect -->
<input use:phoneMaskAction={{ detect: true, onCountryChange: handleCountryChange }} />
```

### Reactive Country

Pass reactive `$state` inside the options object — Svelte calls `update()` automatically when `selectedCountry` changes:

```svelte
<script lang="ts">
  import { phoneMaskAction as phoneMask } from '@desource/phone-mask-svelte';

  let selectedCountry = $state('US');
  let phoneData = $state<{ full: string; digits: string } | null>(null);
</script>

<select bind:value={selectedCountry}>
  <option value="US">🇺🇸 United States</option>
  <option value="GB">🇬🇧 United Kingdom</option>
  <option value="DE">🇩🇪 Germany</option>
</select>

<input
  use:phoneMask={{ country: selectedCountry, onChange: (p) => (phoneData = p) }}
  placeholder="Phone number"
/>
```

### Action vs Attachment

|                          | `use:phoneMaskAction`         | `{@attach phoneMaskAttachment(...)}` |
| ------------------------ | ----------------------------- | ------------------------------------ |
| Svelte version required  | All Svelte 5                  | Svelte 5.29+                         |
| Reactivity mechanism     | `update()` hook (auto-called) | Factory re-runs reactively           |
| Manual `update()` needed | No (Svelte handles it)        | No                                   |

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

```svelte
<PhoneInput bind:value={phone} theme="dark" />
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

```svelte
<script lang="ts">
  import { PhoneInput } from '@desource/phone-mask-svelte';

  let phone = $state('');
  let isValid = $state(false);

  const errorMessage = $derived(!phone ? '' : isValid ? '' : 'Please enter a valid phone number');
</script>

<div>
  <PhoneInput bind:value={phone} country="US" onvalidationchange={(v) => (isValid = v)} />

  {#if errorMessage}
    <span class="error">{errorMessage}</span>
  {/if}
</div>
```

### Auto-detect Country

```svelte
<script lang="ts">
  import { PhoneInput } from '@desource/phone-mask-svelte';
  import type { PMaskFull } from '@desource/phone-mask-svelte';

  let phone = $state('');
  let detectedCountry = $state('');

  function handleCountryChange(country: PMaskFull) {
    detectedCountry = country.name;
  }
</script>

<PhoneInput bind:value={phone} detect oncountrychange={handleCountryChange} />

{#if detectedCountry}
  <p>Detected: {detectedCountry}</p>
{/if}
```

### Programmatic Control

```svelte
<script lang="ts">
  import { PhoneInput } from '@desource/phone-mask-svelte';
  import type { PhoneInputExposed } from '@desource/phone-mask-svelte';

  let phone = $state('');
  let phoneInput = $state<PhoneInputExposed | null>(null);
</script>

<PhoneInput bind:this={phoneInput} bind:value={phone} />

<div>
  <button onclick={() => phoneInput?.focus()}>Focus</button>
  <button onclick={() => phoneInput?.clear()}>Clear</button>
  <button onclick={() => phoneInput?.selectCountry('GB')}>Switch to UK</button>
  <p>Full: {phoneInput?.getFullFormattedNumber()}</p>
  <p>Valid: {phoneInput?.isValid()}</p>
</div>
```

### Multiple Inputs

```svelte
<script lang="ts">
  import { PhoneInput } from '@desource/phone-mask-svelte';

  let form = $state({ mobile: '', home: '', work: '' });
</script>

<div class="form">
  <label>
    Mobile
    <PhoneInput bind:value={form.mobile} country="US" />
  </label>

  <label>
    Home
    <PhoneInput bind:value={form.home} country="US" />
  </label>

  <label>
    Work
    <PhoneInput bind:value={form.work} country="US" />
  </label>
</div>
```

### Custom Composable Implementation

```svelte
<script lang="ts">
  import { usePhoneMask } from '@desource/phone-mask-svelte';
  import type { PMaskPhoneNumber } from '@desource/phone-mask-svelte';

  let inputValue = $state('');
  let selectedCountry = $state('US');

  const phoneMask = usePhoneMask({
    value: () => inputValue,
    country: () => selectedCountry,
    detect: () => false,
    onChange: (digits) => {
      inputValue = digits;
    },
    onPhoneChange: (data: PMaskPhoneNumber) => {
      console.log('Phone:', data.fullFormatted);
    }
  });
</script>

<div class="custom-phone">
  <select bind:value={selectedCountry}>
    <option value="US">🇺🇸 +1</option>
    <option value="GB">🇬🇧 +44</option>
    <option value="DE">🇩🇪 +49</option>
  </select>

  <input bind:this={phoneMask.inputRef} type="tel" placeholder="Phone number" />
</div>

<p>Formatted: {phoneMask.fullFormatted}</p>
<p>Valid: {phoneMask.isComplete ? 'Yes' : 'No'}</p>
<p>Country: {phoneMask.country.name}</p>
```

## 🎯 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Chrome Mobile

## 📦 What's Included

```
@desource/phone-mask-svelte/
├── dist/
│   ├── index.mjs              # Main ESM/Svelte entry
│   ├── index.cjs              # Main CommonJS entry
│   ├── core.mjs               # Core helpers subpath (@desource/phone-mask-svelte/core)
│   ├── core.cjs               # Core helpers CJS subpath
│   ├── phone-mask-svelte.css  # Component styles
│   └── types/                 # TypeScript declaration files
├── README.md                  # This file
└── package.json               # Package manifest
```

## 🔗 Related

- [@desource/phone-mask](../phone-mask) — Core library
- [@desource/phone-mask-nuxt](../phone-mask-nuxt) — Nuxt module
- [@desource/phone-mask-vue](../phone-mask-vue) — Vue 3 bindings
- [@desource/phone-mask-react](../phone-mask-react) — React bindings

## 📄 License

[MIT](../../LICENSE) © 2026 DeSource Labs

## 🤝 Contributing

See [Contributing Guide](../../CONTRIBUTING.md)

---

<div align="center">
  <sub>Made with ❤️ by <a href="https://github.com/DeSource-Labs">DeSource Labs</a></sub>
</div>
