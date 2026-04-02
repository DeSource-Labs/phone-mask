# @desource/phone-mask-vue

> Vue 3 phone input component with Google's libphonenumber data

[![npm version](https://img.shields.io/npm/v/@desource/phone-mask-vue?color=blue&logo=vue.js)](https://www.npmjs.com/package/@desource/phone-mask-vue)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@desource/phone-mask-vue?label=gzip%20size&color=purple)](https://bundlephobia.com/package/@desource/phone-mask-vue)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/DeSource-Labs/phone-mask/blob/main/LICENSE)

Beautiful, accessible, extreme small & tree-shakeable Vue 3 phone input with auto-formatting, country selector, and validation.

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
- 🧩 **Three modes** — Component, composable, or directive
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

Component mode:

```ts
import { createApp } from 'vue';
import { PhoneInput } from '@desource/phone-mask-vue';
import '@desource/phone-mask-vue/assets/lib.css'; // Import styles

const app = createApp(App);
app.component('PhoneInput', PhoneInput);
app.mount('#app');
```

Directive mode (for custom input implementations):

```ts
import { createApp } from 'vue';
import { vPhoneMask } from '@desource/phone-mask-vue';

const app = createApp(App);
app.directive('phone-mask', vPhoneMask);
app.mount('#app');
```

Composable mode (for custom input implementations in case even directive doesn't fit your needs):

```ts
import { usePhoneMask } from '@desource/phone-mask-vue';
```

Core helpers (direct re-exports from `@desource/phone-mask`):

```ts
import { getFlagEmoji, formatDigitsWithMap } from '@desource/phone-mask-vue/core';
```

Register all at once (component + directive):

```ts
import { createApp } from 'vue';
import phoneMask from '@desource/phone-mask-vue';
import '@desource/phone-mask-vue/assets/lib.css'; // Import styles for component mode

const app = createApp(App);
app.use(phoneMask); // Registers component and directive
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

const handleChange = (nextPhone: PMaskPhoneNumber) => {
  phone.value = nextPhone.full;
  digits.value = nextPhone.digits;
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

### Composable Mode

For custom input implementations (in case even directive doesn't fit your needs):

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { usePhoneMask } from '@desource/phone-mask-vue';

const value = ref('');

const { inputRef, digits, full, fullFormatted, isComplete, setCountry } = usePhoneMask({
  value,
  onChange: (newValue) => (value.value = newValue),
  country: 'US',
  detect: true
});
</script>

<template>
  <div>
    <input ref="inputRef" type="tel" placeholder="Phone number" />
    <p>Formatted: {{ fullFormatted }}</p>
    <p>Valid: {{ isComplete ? 'Yes' : 'No' }}</p>
    <button @click="setCountry('GB')">Use UK</button>
  </div>
</template>
```

### Send Raw Digits to Backend

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { PhoneInput, type PMaskPhoneNumber } from '@desource/phone-mask-vue';

const phoneDigits = ref('');

const onPhoneChange = async (phone: PMaskPhoneNumber) => {
  await $fetch('/api/profile/phone', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      phoneDigits: phone.digits, // unformatted value for backend
      phoneFull: phone.full // optional full number with country code
    })
  });
};
</script>

<template>
  <PhoneInput v-model="phoneDigits" country="US" @change="onPhoneChange" />
</template>
```

### Dynamic Mask Updates on Country Change

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { usePhoneMask, type PCountryKey } from '@desource/phone-mask-vue';

const selectedCountry = ref<PCountryKey>('US');
const digits = ref('');

const { inputRef, fullFormatted, isComplete, setCountry } = usePhoneMask({
  value: digits,
  onChange: (value) => (digits.value = value),
  country: selectedCountry
});

const onCountrySelect = (nextCountry: PCountryKey) => {
  selectedCountry.value = nextCountry;
  setCountry(nextCountry); // updates mask immediately
};
</script>

<template>
  <select :value="selectedCountry" @change="onCountrySelect(($event.target as HTMLSelectElement).value as PCountryKey)">
    <option value="US">US</option>
    <option value="GB">GB</option>
    <option value="DE">DE</option>
  </select>

  <input ref="inputRef" type="tel" />
  <p>{{ fullFormatted }}</p>
  <p>{{ isComplete ? 'complete' : 'incomplete' }}</p>
</template>
```

### Multi-tenant: tenantId Default Country + Tenant-specific Validation Rules

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePhoneMask, type PCountryKey } from '@desource/phone-mask-vue';

type TenantPolicy = {
  defaultCountry: PCountryKey;
  prefixRule?: RegExp;
};

const props = defineProps<{ tenantId: string }>();

const TENANT_POLICIES: Record<string, TenantPolicy> = {
  acme: { defaultCountry: 'US', prefixRule: /^(202|303)\d{7}$/ },
  globex: { defaultCountry: 'GB', prefixRule: /^7\d{9}$/ }
};

const tenantPolicy = computed(() => TENANT_POLICIES[props.tenantId] ?? { defaultCountry: 'US' as const });
const digits = ref('');

const {
  inputRef,
  digits: maskDigits,
  isComplete
} = usePhoneMask({
  value: digits,
  onChange: (value) => (digits.value = value),
  country: computed(() => tenantPolicy.value.defaultCountry)
});

const isTenantValid = computed(() => {
  if (!isComplete.value) return false;
  const rule = tenantPolicy.value.prefixRule;
  return rule ? rule.test(maskDigits.value) : true;
});
</script>

<template>
  <input ref="inputRef" type="tel" />
  <p>Default country: {{ tenantPolicy.defaultCountry }}</p>
  <p>Tenant validation: {{ isTenantValid ? 'pass' : 'fail' }}</p>
</template>
```

## 📖 Component API

### Props

```ts
interface PhoneInputProps {
  // v-model binding
  modelValue?: string;

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

## 🪝 Composable API

### `usePhoneMask`

For custom input implementations:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { usePhoneMask } from '@desource/phone-mask-vue';

const value = ref('');

const { inputRef, digits, full, fullFormatted, isComplete, setCountry, clear } = usePhoneMask({
  value,
  onChange: (newValue) => (value.value = newValue),
  country: 'US',
  detect: false
});
</script>

<template>
  <div>
    <input ref="inputRef" type="tel" />
    <button @click="setCountry('GB')">Switch to UK</button>
    <button @click="clear">Clear</button>
    <p>Full: {{ fullFormatted || '—' }}</p>
    <p>Valid: {{ isComplete ? 'Yes' : 'No' }}</p>
  </div>
</template>
```

### Options

> **Note:** The composable requires controlled behavior. Both `value` and `onChange` options are required.

```ts
interface UsePhoneMaskOptions {
  // Controlled value (digits only, without country code) - REQUIRED
  value: MaybeRefOrGetter<string>;

  // Callback when the digits value changes - REQUIRED
  onChange: (digits: string) => void;

  // Predefined country ISO code (e.g., 'US', 'DE', 'GB')
  country?: MaybeRefOrGetter<string | undefined>;

  // Locale for country names (default: navigator.language)
  locale?: MaybeRefOrGetter<string | undefined>;

  // Auto-detect country from IP/locale (default: false)
  detect?: MaybeRefOrGetter<boolean | undefined>;

  // Callback when the phone changes (full, fullFormatted, digits)
  onPhoneChange?: (phone: PhoneNumber) => void;

  // Country change callback
  onCountryChange?: (country: MaskFull) => void;
}
```

### Return Value

```ts
interface UsePhoneMaskReturn {
  // Ref to attach to your input element
  inputRef: ShallowRef<HTMLInputElement | null>;

  // Raw digits without formatting (e.g., "1234567890")
  digits: ComputedRef<string>;

  // Phone formatter instance
  formatter: ComputedRef<FormatterHelpers>;

  // Full phone number with country code (e.g., "+11234567890")
  full: ComputedRef<string>;

  // Full phone number formatted (e.g., "+1 123-456-7890")
  fullFormatted: ComputedRef<string>;

  // Whether the phone number is complete
  isComplete: ComputedRef<boolean>;

  // Whether the input is empty
  isEmpty: ComputedRef<boolean>;

  // Whether to show validation warning
  shouldShowWarn: ComputedRef<boolean>;

  // Current country data
  country: ComputedRef<MaskFull>;

  // Change country programmatically
  setCountry: (countryCode?: string | null) => boolean;

  // Clear the input
  clear: () => void;
}
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
import { PhoneInput, type PMaskFull } from '@desource/phone-mask-vue';

const phone = ref('');
const detectedCountry = ref('');

const handleCountryChange = (country: PMaskFull) => {
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
│   ├── index.mjs           # Main ESM entry
│   ├── index.cjs           # Main CommonJS entry
│   ├── core.mjs            # Core helpers subpath (@desource/phone-mask-vue/core)
│   ├── core.cjs            # Core helpers CJS subpath
│   ├── phone-mask-vue.css  # Component styles
│   └── types/              # TypeScript declarations
├── README.md               # This file
└── package.json            # Package manifest
```

## 🔗 Related

- [@desource/phone-mask](../phone-mask) — Core library
- [@desource/phone-mask-nuxt](../phone-mask-nuxt) — Nuxt module
- [@desource/phone-mask-react](../phone-mask-react) — React bindings

## 📄 License

[MIT](../../LICENSE) © 2026 DeSource Labs

## 🤝 Contributing

See [Contributing Guide](../../CONTRIBUTING.md)

---

<div align="center">
  <sub>Made with ❤️ by <a href="https://github.com/DeSource-Labs">DeSource Labs</a></sub>
</div>
