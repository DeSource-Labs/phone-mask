# @desource/phone-mask-vue

> Vue 3 phone input component with Google's libphonenumber data

[![npm version](https://img.shields.io/npm/v/@desource/phone-mask-vue?color=blue&logo=vue.js)](https://www.npmjs.com/package/@desource/phone-mask-vue)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@desource/phone-mask-vue?label=gzip%20size&color=purple)](https://bundlephobia.com/package/@desource/phone-mask-vue)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/DeSource-Labs/phone-mask/blob/main/LICENSE)

Beautiful, accessible, extreme small & tree-shackable Vue 3 phone input with auto-formatting, country selector, and validation.

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
- 🧩 **Two modes** — Component or directive
- ⚡ **Optimized** — Tree-shaking and code splitting

## 📦 Installation

```bash
npm install @desource/phone-mask-vue
# or
yarn add @desource/phone-mask-vue
# or
pnpm add @desource/phone-mask-vue
```

## 🚀 Quick Start

### Importing

```ts
import { createApp } from 'vue';
import { PhoneInput, vPhoneMask } from '@desource/phone-mask-vue';
import '@desource/phone-mask-vue/assets/lib.css'; // Import styles (for component mode only)

const app = createApp(App);

app.component('PhoneInput', PhoneInput); // Register component if you need component mode
app.directive('phone-mask', vPhoneMask); // Register directive if you need directive mode
app.mount('#app');
```

If you need both modes:

```ts
import { createApp } from 'vue';
import phoneMask from '@desource/phone-mask-vue';
import '@desource/phone-mask-vue/assets/lib.css'; // Import styles for component mode

const app = createApp(App);

app.use(phoneMask); // Registers both component and directive
app.mount('#app');
```

### Component Mode

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { PhoneInput } from '@desource/phone-mask-vue';

const phoneDigits = ref('');
const isValid = ref(false);
</script>

<template>
  <PhoneInput v-model="phoneDigits" country="US" theme="light" @validation-change="isValid = $event" />

  <p v-if="isValid">✓ Valid phone number</p>
</template>
```

### Directive Mode

For custom styling with automatic formatting:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { PMaskPhoneNumber } from '@desource/phone-mask-vue';

const country = ref('US');
const phone = ref('');
const digits = ref('');

const handleChange = (phone: PMaskPhoneNumber) => {
  phone.value = phone.full;
  digits.value = phone.digits;
};
</script>

<template>
  <div class="phone-wrapper">
    <select v-model="country">
      <option value="US">🇺🇸 +1</option>
      <option value="GB">🇬🇧 +44</option>
      <option value="DE">🇩🇪 +49</option>
    </select>

    <input
      v-phone-mask="{
        country,
        onChange: handleChange
      }"
      placeholder="Phone number"
    />
  </div>

  <p>{{ digits }} digits entered</p>
</template>
```

## 📖 Component API

### Props

```ts
interface PhoneInputProps {
  // v-model binding
  modelValue?: string;

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
  // v-model update
  'update:modelValue': (value: string) => void;

  // Value changed
  // Provides an object with:
  // - full: Full phone number with country code (e.g. +1234567890)
  // - fullFormatted: Full phone number formatted according to country rules (e.g. +1 234-567-890)
  // - digits: Only the digits of the phone number without country code (e.g. 234567890)
  change: (value: PMaskPhoneNumber) => void;

  // Country changed
  'country-change': (country: PMaskFull) => void;

  // Validation state changed
  'validation-change': (isValid: boolean) => void;

  // Input focused
  focus: (event: FocusEvent) => void;

  // Input blurred
  blur: (event: FocusEvent) => void;

  // Copy button clicked
  copy: (value: string) => void;

  // When input is cleared
  clear: () => void;
}
```

### Exposed Methods

```ts
interface PhoneInputExpose {
  // Focus the phone input
  focus: () => void;

  // Blur the phone input
  blur: () => void;

  // Clear the phone input
  clear: () => void;

  // Select a country by its ISO 3166-1 alpha-2 code
  selectCountry: (country: CountryKey) => void;

  // Get the full phone number with country code (e.g. +1234567890)
  getFullNumber: () => string;

  // Get the full phone number formatted according to country rules (e.g. +1 234-567-890)
  getFullFormattedNumber: () => string;

  // Get only the digits of the phone number without country code (e.g. 234567890)
  getDigits: () => string;

  // Check if the current phone number is valid
  isValid: () => boolean;

  // Check if the current phone number is complete
  isComplete: () => boolean;
}
```

### Slots

- `actions-before` — Slot for custom actions before default buttons

- `flag` — Slot for custom country flag rendering in the country list and country selector

- `copy-svg` — Slot for custom copy button SVG icon

- `clear-svg` — Slot for custom clear button SVG icon

### Usage with Refs

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { PhoneInput } from '@desource/phone-mask-vue';

const phoneInputRef = ref<InstanceType<typeof PhoneInput>>();

const focusInput = () => {
  phoneInputRef.value?.focus();
};

const clearInput = () => {
  phoneInputRef.value?.clear();
};
</script>

<template>
  <PhoneInput ref="phoneInputRef" v-model="phone" />
  <button @click="focusInput">Focus</button>
  <button @click="clearInput">Clear</button>
</template>
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

```vue
<template>
  <PhoneInput v-model="phone" theme="dark" />
</template>
```

Or with CSS:

```css
.phone-input[data-theme='dark'] {
  --pi-bg: #1f2937;
  --pi-fg: #f9fafb;
  --pi-border: #374151;
}
```

## 🧩 Directive API

### Basic Usage

```vue
<template>
  <input v-phone-mask="'US'" />
</template>
```

### With Options

```ts
interface PMaskDirectiveOptions {
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

```vue
<template>
  <input
    v-phone-mask="{
      country: 'US',
      locale: 'en',
      onChange: handleChange,
      onCountryChange: handleCountryChange
    }"
  />
</template>
```

### Reactive Country

```vue
<script setup lang="ts">
import type { PMaskPhoneNumber } from '@desource/phone-mask-vue';

const selectedCountry = ref('US');

const handleChange = (phone: PMaskPhoneNumber) => {
  console.log('Phone:', phone.full, 'Digits:', phone.digits);
};
</script>

<template>
  <select v-model="selectedCountry">
    <option value="US">🇺🇸 United States</option>
    <option value="GB">🇬🇧 United Kingdom</option>
  </select>

  <input
    v-phone-mask="{
      country: selectedCountry,
      onChange: handleChange
    }"
  />
</template>
```

## 📚 Examples

### With Validation

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { PhoneInput } from '@desource/phone-mask-vue';

const phone = ref('');
const isValid = ref(false);

const errorMessage = computed(() => {
  if (!phone.value) return '';
  return isValid.value ? '' : 'Please enter a valid phone number';
});
</script>

<template>
  <div>
    <PhoneInput v-model="phone" country="US" @validation-change="isValid = $event" />

    <span v-if="errorMessage" class="error">
      {{ errorMessage }}
    </span>
  </div>
</template>
```

### Auto-detect Country

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { PhoneInput, type MaskFull } from '@desource/phone-mask-vue';

const phone = ref('');
const detectedCountry = ref('');

const handleCountryChange = (country: MaskFull) => {
  detectedCountry.value = country.name;
};
</script>

<template>
  <PhoneInput v-model="phone" detect @country-change="handleCountryChange" />

  <p v-if="detectedCountry">Detected: {{ detectedCountry }}</p>
</template>
```

### With Form Libraries

#### VeeValidate

```vue
<script setup lang="ts">
import { useField } from 'vee-validate';
import { PhoneInput } from '@desource/phone-mask-vue';

const { value, errorMessage } = useField('phone', (value) => {
  if (!value) return 'Phone is required';
  // Add custom validation
  return true;
});
</script>

<template>
  <PhoneInput v-model="value" />
  <span v-if="errorMessage">{{ errorMessage }}</span>
</template>
```

### Multiple Inputs

```vue
<script setup lang="ts">
import { reactive } from 'vue';
import { PhoneInput } from '@desource/phone-mask-vue';

const form = reactive({
  mobile: '',
  home: '',
  work: ''
});
</script>

<template>
  <div class="form">
    <label>
      Mobile
      <PhoneInput v-model="form.mobile" country="US" />
    </label>

    <label>
      Home
      <PhoneInput v-model="form.home" country="US" />
    </label>

    <label>
      Work
      <PhoneInput v-model="form.work" country="US" />
    </label>
  </div>
</template>
```

## 🎯 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Chrome Mobile

## 📦 What's Included

```
@desource/phone-mask-vue/
├── dist/
│   ├── types               # TypeScript definitions
│   ├── index.js            # ESM bundle
│   ├── index.cjs           # CommonJS bundle
│   ├── index.mjs           # ESM module bundle
│   └── phone-mask-vue.css  # Component styles
├── README.md               # This file
└── package.json            # Package manifest
```

## 🔗 Related

- [@desource/phone-mask](../phone-mask) — Core library
- [@desource/phone-mask-nuxt](../phone-mask-nuxt) — Nuxt module

## 📄 License

[MIT](../../LICENSE) © 2025 DeSource Labs

## 🤝 Contributing

See [Contributing Guide](../../CONTRIBUTING.md)

---

<div align="center">
  <sub>Made with ❤️ by <a href="https://github.com/DeSource-Labs">DeSource Labs</a></sub>
</div>
