# @desource/phone-mask-nuxt

> Nuxt module for phone input with Google's libphonenumber data

[![npm version](https://img.shields.io/npm/v/@desource/phone-mask-nuxt?color=blue&logo=nuxt.js)](https://www.npmjs.com/package/@desource/phone-mask-nuxt)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/DeSource-Labs/phone-mask/blob/main/LICENSE)

Drop-in Nuxt module with auto-imports, SSR support, and zero configuration.

## ✨ Features

- 🎯 **Zero Config** — Works out of the box
- 🔄 **Auto-imports** — Component, directive, and types by default
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

That's it! The component, directive, and related mask types are now auto-imported.
You can additionally enable helper/composable auto-imports via module options.

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

<script setup lang="ts">
import { ref } from 'vue';
import type { PMaskPhoneNumber } from '#imports';

const selectedCountry = ref('US');
const phone = ref<PMaskPhoneNumber>({
  full: '',
  fullFormatted: '',
  digits: ''
});

const handleChange = (nextPhone: PMaskPhoneNumber) => {
  phone.value = nextPhone;
};
</script>
```

### SSR + Auto-imports in Practice

`@desource/phone-mask-nuxt` is SSR-safe: the module config is evaluated on server, while the UI component is registered in client mode.

```vue
<script setup lang="ts">
const phone = ref('');
const valid = ref(false);
</script>

<template>
  <!-- Auto-imported: no explicit component import required -->
  <PhoneInput id="phone" name="phone" v-model="phone" country="US" @validation-change="valid = $event" />

  <p v-if="valid">✓ Ready to submit</p>
</template>
```

### Backend Payload (Raw Digits)

```vue
<script setup lang="ts">
import type { PMaskPhoneNumber } from '#imports';

const phoneDigits = ref('');

const handlePhoneChange = async (phone: PMaskPhoneNumber) => {
  await $fetch('/api/profile/phone', {
    method: 'POST',
    body: {
      phoneDigits: phone.digits, // unformatted value for backend
      phoneFull: phone.full // optional full number with country code
    }
  });
};
</script>

<template>
  <PhoneInput v-model="phoneDigits" country="US" @change="handlePhoneChange" />
</template>
```

### Auto-importing Helpers + Composable

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@desource/phone-mask-nuxt'],
  phoneMask: {
    // Disable auto-imported styles, component, and directive if you don't need them
    css: false,
    component: false,
    directive: false,
    // And enable only needed auto-imports
    helpers: true,
    composable: true
  }
});
```

Then use them directly in SFCs without manual imports:

```vue
<script setup lang="ts">
const value = ref('');
const selectedCountry = ref('US');

const { inputRef, setCountry } = usePhoneMask({
  value,
  onChange: (digits) => (value.value = digits),
  country: selectedCountry
});

const setGermany = () => {
  setCountry('DE');
};
</script>

<template>
  <input ref="inputRef" type="tel" />
  <button @click="setGermany">Use Germany</button>
  <p>Code for DE: {{ PMaskHelpers.MasksMap.DE.code }}</p>
</template>
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

    // Register mask-related TypeScript types
    types: true, // Default: true

    // Register shared helper namespace + directive helper
    helpers: false, // Default: false

    // Register usePhoneMask composable
    composable: false // Default: false
  }
});
```

### Enable Helpers and Composable Auto-imports

```ts
export default defineNuxtConfig({
  modules: ['@desource/phone-mask-nuxt'],
  phoneMask: {
    helpers: true,
    composable: true
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

The module provides automatic TypeScript support. You can import Nuxt-registered types from `#imports`:

```ts
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
} from '#imports';
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
      this.phoneDigits = phone;
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
  <PhoneInput v-model="phone" :locale="$i18n.locale" :search-placeholder="$t('phone.searchPlaceholder')" />
</template>

<script setup>
const { locale, t } = useI18n();
const phone = ref('');
</script>
```

## 🎯 Auto-imports

By default (without extra options), Nuxt auto-imports:

### Components

- `PhoneInput` — Main phone input component

### Directives

- `vPhoneMask` — Phone mask directive

### Types

- `PCountryKey`
- `PMaskBase`, `PMaskBaseMap`
- `PMask`, `PMaskMap`
- `PMaskWithFlag`, `PMaskWithFlagMap`
- `PMaskFull`, `PMaskFullMap`
- `PMaskPhoneNumber`

Enable `phoneMask.helpers: true` to auto-import:

- `vPhoneMaskSetCountry` — Programmatically set country for directive
- `PMaskHelpers` — Utility functions from `@desource/phone-mask-vue/core`

Enable `phoneMask.composable: true` to auto-import:

- `usePhoneMask`

## 🔄 Migration from Vue Plugin

If you're migrating from the Vue plugin:

**Before:**

```ts
// main.ts
import PhoneMaskPlugin from '@desource/phone-mask-vue';
import '@desource/phone-mask-vue/assets/lib.css';

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

- `PhoneInput` component (auto-imported by default)
- `vPhoneMask` directive (auto-imported by default)
- Mask-related TypeScript types (auto-imported by default)
- Default styles (auto-imported by default, can be disabled)
- `vPhoneMaskSetCountry` and `PMaskHelpers` (optional via `phoneMask.helpers`)
- `usePhoneMask` (optional via `phoneMask.composable`)

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
