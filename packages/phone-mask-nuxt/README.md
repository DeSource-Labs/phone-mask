# @desource/phone-mask-nuxt

> Nuxt module for phone input with Google's libphonenumber data

[![npm version](https://img.shields.io/npm/v/@desource/phone-mask-nuxt?color=blue&logo=nuxt.js)](https://www.npmjs.com/package/@desource/phone-mask-nuxt)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/DeSource-Labs/phone-mask/blob/main/LICENSE)

Drop-in Nuxt module with auto-imports, SSR support, and zero configuration.

## ✨ Features

- 🎯 **Zero Config** — Works out of the box
- 🔄 **Auto-imports** — Components and composables
- 🌐 **SSR Compatible** — Server-side rendering ready
- 🎨 **Styleable** — Bring your own styles or use defaults
- 🔧 **TypeScript** — Fully typed
- ⚡ **Optimized** — Tree-shaking and code splitting

## 📦 Installation

```bash
npm install @desource/phone-mask-nuxt
# or
yarn add @desource/phone-mask-nuxt
# or
pnpm add @desource/phone-mask-nuxt
```

## 🚀 Setup

Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@desource/phone-mask-nuxt']
});
```

That's it! The component and directive are now auto-imported.

## 📖 Usage

### Basic Component

```vue
<template>
  <div>
    <PhoneInput v-model="phone" country="US" />
    <p>Phone: {{ phone }}</p>
  </div>
</template>

<script setup lang="ts">
const phone = ref('');
</script>
```

### With Auto-detection

```vue
<template>
  <PhoneInput v-model="phone" detect @country-change="onCountryChange" />
</template>

<script setup>
const phone = ref('');

const onCountryChange = (country) => {
  console.log('Detected country:', country.name);
};
</script>
```

### Using the Directive

```vue
<template>
  <div class="phone-wrapper">
    <select v-model="selectedCountry">
      <option value="US">🇺🇸 +1</option>
      <option value="GB">🇬🇧 +44</option>
      <option value="DE">🇩🇪 +49</option>
    </select>

    <input
      v-phone-mask="{
        country: selectedCountry,
        onChange: handleChange
      }"
      class="phone-input"
    />
  </div>
</template>

<script setup>
const selectedCountry = ref('US');
const phone = ref('');

const handleChange = (fullNumber, digits) => {
  phone.value = fullNumber;
};
</script>
```

## ⚙️ Configuration

### Module Options

Configure the module in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@desource/phone-mask-nuxt'],

  phoneMask: {
    // Import styles automatically
    css: true, // Default: true

    // Register PhoneInput component
    component: true, // Default: true

    // Register v-phone-mask directive
    directive: true, // Default: true

    // Register shared helpers and types
    helpers: true // Default: true
  }
});
```

### Custom Styling

#### Option 1: Disable auto CSS import

```ts
export default defineNuxtConfig({
  modules: ['@desource/phone-mask-nuxt'],

  phoneMask: {
    css: false // Don't auto-import styles
  }
});
```

Then import manually where needed:

```vue
<style>
@import '@desource/phone-mask-vue/assets/lib.css';

/* Your custom overrides */
.phone-input {
  --pi-border: #your-color;
}
</style>
```

#### Option 2: Override CSS variables

```vue
<style>
:root {
  --pi-bg: #f9fafb;
  --pi-border: #e5e7eb;
  --pi-border-focus: #3b82f6;
  --pi-text: #111827;
}
</style>
```

## 🔧 TypeScript

The module provides automatic TypeScript support. Types are available globally:

```ts
// Auto-imported types
import type {
  PCountryKey,
  PMaskBase,
  PMaskBaseMap,
  PMask,
  PMaskMap,
  PMaskWithFlag,
  PMaskWithFlagMap,
  PMaskFull,
  PMaskFullMap,
  PMaskPhoneNumber
} from '#phone-mask';
```

## 📚 Examples

### Form Integration

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label for="name">Name</label>
      <input id="name" v-model="form.name" type="text" />
    </div>

    <div>
      <label for="phone">Phone</label>
      <PhoneInput id="phone" v-model="form.phone" country="US" @validation-change="phoneValid = $event" />
    </div>

    <button type="submit" :disabled="!phoneValid">Submit</button>
  </form>
</template>

<script setup>
const form = reactive({
  name: '',
  phone: ''
});

const phoneValid = ref(false);

const handleSubmit = () => {
  console.log('Form data:', form);
};
</script>
```

### With Pinia Store

```ts
// stores/user.ts
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    phoneDigits: '',
    country: 'US'
  }),

  actions: {
    setPhoneDigits(phone: string) {
      this.phone = phone;
    },

    setCountry(id: string) {
      this.country = id;
    }
  }
});
```

```vue
<template>
  <PhoneInput
    :model-value="userStore.phoneDigits"
    :country="userStore.country"
    @update:model-value="userStore.setPhoneDigits"
    @country-change="userStore.setCountry($event.id)"
  />
</template>

<script setup>
const userStore = useUserStore();
</script>
```

### Multi-step Form

```vue
<template>
  <div>
    <div v-if="step === 1">
      <h2>Step 1: Contact Info</h2>
      <PhoneInput v-model="formData.phone" country="US" @validation-change="phoneValid = $event" />
      <button @click="nextStep" :disabled="!phoneValid">Next</button>
    </div>

    <div v-if="step === 2">
      <h2>Step 2: Verification</h2>
      <p>We'll send a code to: {{ formData.phone }}</p>
      <button @click="prevStep">Back</button>
      <button @click="submit">Send Code</button>
    </div>
  </div>
</template>

<script setup>
const step = ref(1);
const phoneValid = ref(false);
const formData = reactive({
  phone: ''
});

const nextStep = () => {
  if (phoneValid.value) step.value++;
};

const prevStep = () => {
  step.value--;
};

const submit = async () => {
  // Send verification code
};
</script>
```

### i18n Integration

```vue
<template>
  <PhoneInput v-model="phone" :locale="$i18n.locale" :placeholder="$t('phone.placeholder')" />
</template>

<script setup>
const { locale, t } = useI18n();
const phone = ref('');
</script>
```

## 🎯 Auto-imports

The following are automatically imported (until disabled in nuxt.config.ts):

### Components

- `PhoneInput` — Main phone input component

### Directives

- `vPhoneMask` — Phone mask directive

### Helpers

- `vPhoneMaskSetCountry` — Programmatically set country for directive
- `PMaskHelpers` — Utility functions for phone masks like:
  - `getFlagEmoji`
  - `countPlaceholders`
  - `formatDigitsWithMap`
  - `pickMaskVariant`
  - `removeCountryCodePrefix`
  - And more...

Read more about helpers in the [Utility Functions of @desource/phone-mask README](../phone-mask/README.md#utility-functions).

### Types

All TypeScript types from `@desource/phone-mask-vue`

## 🔄 Migration from Vue Plugin

If you're migrating from the Vue plugin:

**Before:**

```ts
// main.ts
import PhoneMaskPlugin from '@desource/phone-mask-vue';
import '@desource/phone-mask-vue/style.css';

app.use(PhoneMaskPlugin);
```

**After:**

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@desource/phone-mask-nuxt']
});
```

No changes needed in your components!

## 📦 What's Included

- `PhoneInput` component (auto-imported)
- `vPhoneMask` directive (auto-imported)
- Default styles (auto-imported, can be disabled)
- TypeScript definitions (auto-imported)
- Utility functions (auto-imported)

## 🔗 Related

- [@desource/phone-mask](../phone-mask) — Core library
- [@desource/phone-mask-vue](../phone-mask-vue) — Vue 3 component
- [@desource/phone-mask-react](../phone-mask-react) — React bindings
- [@desource/phone-mask-svelte](../phone-mask-svelte) — Svelte bindings

## 📄 License

[MIT](../../LICENSE) © 2026 DeSource Labs

## 🤝 Contributing

See [Contributing Guide](../../CONTRIBUTING.md)

---

<div align="center">
  <sub>Made with ❤️ by <a href="https://github.com/DeSource-Labs">DeSource Labs</a></sub>
</div>
