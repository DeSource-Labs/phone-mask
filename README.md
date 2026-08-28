<div align="center">
  <h1>📱 Phone Mask</h1>
  <p><strong>The best-in-class international phone input for React, Vue, Svelte, Nuxt, and TypeScript—tiny, accessible, and backed by country data updated weekly from Google's libphonenumber.</strong></p>

  <p>
    <a href="https://www.npmjs.com/package/@desource/phone-mask"><img src="https://img.shields.io/npm/v/@desource/phone-mask?color=blue&logo=npm" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@desource/phone-mask"><img src="https://img.shields.io/npm/dm/@desource/phone-mask?color=green" alt="npm downloads"></a>
    <a href="https://github.com/DeSource-Labs/phone-mask/blob/main/docs/comparison.md#current-package-sizes"><img src="https://raw.githubusercontent.com/DeSource-Labs/phone-mask/main/.github/badges/phone-mask.svg" alt="measured core gzip size"></a>
    <a href="https://codecov.io/gh/DeSource-Labs/phone-mask"><img src="https://codecov.io/gh/DeSource-Labs/phone-mask/branch/main/graph/badge.svg" alt="code coverage"></a>
    <a href="https://github.com/DeSource-Labs/phone-mask/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license"></a>
  </p>

  <p>
    <a href="https://phonemask.desource-labs.org">Live demo</a> ·
    <a href="#choose-your-package">Choose your package</a> ·
    <a href="#quick-start">Quick start</a> ·
    <a href="#documentation">Documentation</a>
  </p>
</div>

Ship a polished international phone field without a heavyweight runtime. Start with the ready-made `PhoneInput`, use a headless API with your design system, or attach smart masking to markup you already own.

## 🌍 Why Phone Mask

- **Google-backed worldwide coverage.** Masks and calling codes for 245 countries and territories are generated from [Google's libphonenumber](https://github.com/google/libphonenumber) data and refreshed weekly. Localized names and flags are bundled too.
- **Best-in-class size you can reproduce.** Self-hosted badges are rebuilt from packed packages in clean consumer projects. In the current dated audit, Phone Mask leads four measured categories and sits in the smallest displayed React tier.
- **A native API for each stack.** React, Vue, Svelte, Nuxt, and framework-free TypeScript share the same data and formatting behavior.
- **The hard input details are already handled.** Stable cursor movement, country search, keyboard navigation, validation feedback, clipboard actions, themes, and mobile input modes work out of the box.
- **Use exactly as much UI as you need.** Render `PhoneInput`, build custom markup with a hook or composable, or add masking to an existing input.

[See current sizes and the reproducible market comparison.](./docs/comparison.md)

## 📦 Choose your package

| Stack                   | Package                                                       | Install                                   |                                                                                                                                                           Measured gzip |
| ----------------------- | ------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| React                   | [`@desource/phone-mask-react`](./packages/phone-mask-react)   | `npm install @desource/phone-mask-react`  |   [![React gzip size](https://raw.githubusercontent.com/DeSource-Labs/phone-mask/main/.github/badges/phone-mask-react.svg)](./docs/comparison.md#current-package-sizes) |
| Vue 3                   | [`@desource/phone-mask-vue`](./packages/phone-mask-vue)       | `npm install @desource/phone-mask-vue`    |       [![Vue gzip size](https://raw.githubusercontent.com/DeSource-Labs/phone-mask/main/.github/badges/phone-mask-vue.svg)](./docs/comparison.md#current-package-sizes) |
| Svelte 5                | [`@desource/phone-mask-svelte`](./packages/phone-mask-svelte) | `npm install @desource/phone-mask-svelte` | [![Svelte gzip size](https://raw.githubusercontent.com/DeSource-Labs/phone-mask/main/.github/badges/phone-mask-svelte.svg)](./docs/comparison.md#current-package-sizes) |
| Nuxt                    | [`@desource/phone-mask-nuxt`](./packages/phone-mask-nuxt)     | `npm install @desource/phone-mask-nuxt`   |     [![Nuxt gzip size](https://raw.githubusercontent.com/DeSource-Labs/phone-mask/main/.github/badges/phone-mask-nuxt.svg)](./docs/comparison.md#current-package-sizes) |
| TypeScript / JavaScript | [`@desource/phone-mask`](./packages/phone-mask)               | `npm install @desource/phone-mask`        |          [![Core gzip size](https://raw.githubusercontent.com/DeSource-Labs/phone-mask/main/.github/badges/phone-mask.svg)](./docs/comparison.md#current-package-sizes) |

## ⚡ Quick start

### React

```tsx
import { useState } from 'react';
import { PhoneInput } from '@desource/phone-mask-react';
import '@desource/phone-mask-react/assets/lib.css';

export function ContactForm() {
  const [phone, setPhone] = useState('');

  return <PhoneInput value={phone} onChange={setPhone} country="US" />;
}
```

### Vue 3

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { PhoneInput } from '@desource/phone-mask-vue';
import '@desource/phone-mask-vue/assets/lib.css';

const phone = ref('');
</script>

<template>
  <PhoneInput v-model="phone" country="US" />
</template>
```

### Svelte 5

```svelte
<script lang="ts">
  import { PhoneInput } from '@desource/phone-mask-svelte';
  import '@desource/phone-mask-svelte/assets/lib.css';

  let phone = $state('');
</script>

<PhoneInput bind:value={phone} country="US" />
```

### Nuxt

Add one module:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@desource/phone-mask-nuxt']
});
```

Then use the auto-imported component. Styles are included automatically.

```vue
<script setup lang="ts">
const phone = ref('');
</script>

<template>
  <PhoneInput v-model="phone" country="US" />
</template>
```

### TypeScript or JavaScript

```ts
import { MasksFullMapEn } from '@desource/phone-mask';
import { formatDigitsWithMap } from '@desource/phone-mask/kit';

const mask = MasksFullMapEn.US.mask[0];
const phone = formatDigitsWithMap(mask, '2025551234').display;

console.log(phone); // "202-555-1234"
```

## 🧩 Built for real forms

- As-you-type formatting with stable cursor positioning
- Country selector with fuzzy search and keyboard control
- Country detection from GeoIP and browser locale
- Complete-number checks and validation events
- Raw digits, international value, and formatted value for backend payloads
- Accessible labels, focus behavior, and keyboard navigation
- Light, dark, and custom themes
- Tree-shakeable TypeScript APIs

## 🎮 Live demo

[Try Phone Mask in the interactive playground](https://phonemask.desource-labs.org), switch frameworks, copy an install command, and test formatting before adding it to your app.

## 📚 Documentation

- [Core TypeScript / JavaScript](./packages/phone-mask/README.md)
- [React](./packages/phone-mask-react/README.md)
- [Vue 3](./packages/phone-mask-vue/README.md)
- [Svelte 5](./packages/phone-mask-svelte/README.md)
- [Nuxt](./packages/phone-mask-nuxt/README.md)
- [Bundle sizes and market comparison](./docs/comparison.md)
- [Context7 documentation](https://context7.com/desource-labs/phone-mask)

## 🤝 Contributing

Issues and pull requests are welcome. The [Contributing Guide](./CONTRIBUTING.md) covers setup, tests, changesets, and release-ready package changes.

```bash
pnpm install
pnpm build
pnpm test:unit
```

## 💜 DeSource Labs

Phone Mask is created by [Stefan Popov](https://github.com/stefashkaa) and built and maintained by [DeSource Labs](https://github.com/DeSource-Labs).

<div align="center">
  <a href="https://github.com/DeSource-Labs">
    <img src="https://github.com/DeSource-Labs.png?size=100" width="50" height="50" alt="DeSource Labs">
  </a>
</div>

## 📄 License

[MIT](./LICENSE) © 2026 DeSource Labs

---

<div align="center">
  <sub>Built with ❤️ by the <a href="https://github.com/DeSource-Labs">DeSource Labs</a> team</sub>
</div>
