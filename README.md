<div align="center">
  <h1>📱 Phone Mask</h1>
  <p><strong>Always-fresh, extreme small & easy-to-use international phone masking with Google's libphonenumber data</strong></p>

  <p>
    <a href="https://www.npmjs.com/package/@desource/phone-mask"><img src="https://img.shields.io/npm/v/@desource/phone-mask?color=blue&logo=npm" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@desource/phone-mask"><img src="https://img.shields.io/npm/dm/@desource/phone-mask?color=green" alt="npm downloads"></a>
    <a href="https://bundlephobia.com/package/@desource/phone-mask"><img src="https://img.shields.io/bundlephobia/minzip/@desource/phone-mask?label=gzip%20size&color=purple" alt="bundle size"></a>
    <a href="https://codecov.io/gh/DeSource-Labs/phone-mask"><img src="https://codecov.io/gh/DeSource-Labs/phone-mask/branch/main/graph/badge.svg" alt="code coverage"></a>
    <a href="https://github.com/DeSource-Labs/phone-mask/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license"></a>
  </p>

  <p>
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-packages">Packages</a> •
    <a href="#-features">Features</a> •
    <a href="#-demo">Demo</a> •
    <a href="#-contributing">Contributing</a>
  </p>
</div>

---

## 🎯 Why Phone Mask?

### 🔄 Always Up-to-Date

Phone formats sync automatically from [Google's libphonenumber](https://github.com/google/libphonenumber) — no stale data, no manual updates. Just upgrade and you're current with global dialing rules.

<!-- benchmarks:start -->

### 🪶 Lightest in Class

Real market comparison, segmented by ecosystem.
Snapshot: **2026-03-21** ([Bundlephobia API](https://bundlephobia.com/api/size?package=%40desource%2Fphone-mask), [npm Registry API](https://registry.npmjs.org/%40desource%2Fphone-mask)).

#### Core (TypeScript/JavaScript)

| Package                                                                        |                                                             | Last published | Minified |  Gzipped |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------: | -------------: | -------: | -------: |
| [**@desource/phone-mask**](https://www.npmjs.com/package/@desource/phone-mask) |         [Repo](https://github.com/DeSource-Labs/phone-mask) |     2026-03-15 |  16.7 KB |   5.6 KB |
| [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js)           | [Repo](https://gitlab.com/catamphetamine/libphonenumber-js) |     2026-03-13 | 179.0 KB |  43.7 KB |
| [google-libphonenumber](https://www.npmjs.com/package/google-libphonenumber)   | [Repo](https://github.com/ruimarinho/google-libphonenumber) |     2026-01-19 | 566.8 KB | 115.2 KB |
| [awesome-phonenumber](https://www.npmjs.com/package/awesome-phonenumber)       |     [Repo](https://github.com/grantila/awesome-phonenumber) |     2026-02-18 | 336.9 KB |  75.4 KB |

#### React

| Package                                                                                    |                                                                    | Last published | Minified | Gzipped |
| ------------------------------------------------------------------------------------------ | -----------------------------------------------------------------: | -------------: | -------: | ------: |
| [**@desource/phone-mask-react**](https://www.npmjs.com/package/@desource/phone-mask-react) |                [Repo](https://github.com/DeSource-Labs/phone-mask) |     2026-03-15 |  28.9 KB |  9.7 KB |
| [react-phone-number-input](https://www.npmjs.com/package/react-phone-number-input)         | [Repo](https://gitlab.com/catamphetamine/react-phone-number-input) |     2026-02-23 | 195.5 KB | 46.7 KB |
| [react-phone-input-2](https://www.npmjs.com/package/react-phone-input-2)                   |            [Repo](https://github.com/bl00mber/react-phone-input-2) |     2022-07-01 |  53.7 KB | 17.1 KB |
| [react-international-phone](https://www.npmjs.com/package/react-international-phone)       |   [Repo](https://github.com/ybrusentsov/react-international-phone) |     2026-02-21 |  26.1 KB |  9.4 KB |
| [mui-tel-input](https://www.npmjs.com/package/mui-tel-input)                               |                [Repo](https://github.com/viclafouch/mui-tel-input) |     2025-05-18 | 167.4 KB | 45.8 KB |

#### Vue

| Package                                                                                |                                                              | Last published | Minified | Gzipped |
| -------------------------------------------------------------------------------------- | -----------------------------------------------------------: | -------------: | -------: | ------: |
| [**@desource/phone-mask-vue**](https://www.npmjs.com/package/@desource/phone-mask-vue) |          [Repo](https://github.com/DeSource-Labs/phone-mask) |     2026-03-15 |  34.8 KB | 11.0 KB |
| [vue-tel-input](https://www.npmjs.com/package/vue-tel-input)                           |        [Repo](https://github.com/iamstevendao/vue-tel-input) |     2026-03-19 |  27.7 KB | 10.3 KB |
| [v-phone-input](https://www.npmjs.com/package/v-phone-input)                           |        [Repo](https://github.com/paul-thebaud/v-phone-input) |     2026-03-11 | 239.1 KB | 15.0 KB |
| [vue-phone-number-input](https://www.npmjs.com/package/vue-phone-number-input)         | [Repo](https://github.com/LouisMazel/vue-phone-number-input) |     2022-09-20 | 325.7 KB | 95.7 KB |

#### Svelte

| Package                                                                                      |                                                      | Last published | Minified | Gzipped |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------: | -------------: | -------: | ------: |
| [**@desource/phone-mask-svelte**](https://www.npmjs.com/package/@desource/phone-mask-svelte) |  [Repo](https://github.com/DeSource-Labs/phone-mask) |     2026-03-15 |  36.0 KB | 11.5 KB |
| [svelte-tel-input](https://www.npmjs.com/package/svelte-tel-input)                           | [Repo](https://github.com/gyurielf/svelte-tel-input) |     2025-11-17 | 234.4 KB | 62.9 KB |

#### Nuxt

| Package                                                                                  |                                                     | Last published | Minified | Gzipped |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------: | -------------: | -------: | ------: |
| [**@desource/phone-mask-nuxt**](https://www.npmjs.com/package/@desource/phone-mask-nuxt) | [Repo](https://github.com/DeSource-Labs/phone-mask) |     2026-03-15 |   1.5 KB |  0.7 KB |

Nuxt ecosystem note: there are currently no widely adopted Nuxt-only phone input modules with stable npm + Bundlephobia signals comparable to React/Vue/Svelte peers; most Nuxt apps use Vue phone input packages directly.

<!-- benchmarks:end -->

### 🎨 Framework-Ready

Ready-made plugins for your stack:

- ✅ **Vue 3** — Component, composable, and directive
- ✅ **Nuxt** — Auto-imported, SSR-compatible
- ✅ **React** — Component & hook with modern React patterns
- ✅ **Svelte** — Component, composable, action, and attachment for Svelte 5
- ✅ **TypeScript/Vanilla JS** — Framework-agnostic core

---

## 📦 Packages

| Package                                                     | Version                                                                     | Description                                           |
| ----------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- |
| [@desource/phone-mask](./packages/phone-mask)               | ![npm](https://img.shields.io/npm/v/@desource/phone-mask?color=blue)        | Core library — TypeScript/JS                          |
| [@desource/phone-mask-react](./packages/phone-mask-react)   | ![npm](https://img.shields.io/npm/v/@desource/phone-mask-react?color=blue)  | React component + hook                                |
| [@desource/phone-mask-vue](./packages/phone-mask-vue)       | ![npm](https://img.shields.io/npm/v/@desource/phone-mask-vue?color=blue)    | Vue 3 component + composable + directive              |
| [@desource/phone-mask-svelte](./packages/phone-mask-svelte) | ![npm](https://img.shields.io/npm/v/@desource/phone-mask-svelte?color=blue) | Svelte 5 component + composable + action + attachment |
| [@desource/phone-mask-nuxt](./packages/phone-mask-nuxt)     | ![npm](https://img.shields.io/npm/v/@desource/phone-mask-nuxt?color=blue)   | Nuxt module                                           |

---

## ⚡ Quick Start

### React

```bash
npm install @desource/phone-mask-react
```

```tsx
import { useState } from 'react';
import { PhoneInput } from '@desource/phone-mask-react';
import '@desource/phone-mask-react/assets/lib.css';

function App() {
  const [phone, setPhone] = useState('');

  return <PhoneInput value={phone} onChange={setPhone} country="US" />;
}
```

### Vue 3

```bash
npm install @desource/phone-mask-vue
```

```vue
<script setup>
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

```bash
npm install @desource/phone-mask-svelte
```

```svelte
<script lang="ts">
import { PhoneInput } from '@desource/phone-mask-svelte';
import '@desource/phone-mask-svelte/assets/lib.css';

let phone = $state('');
</script>

<PhoneInput bind:value={phone} country="US" />
```

### Nuxt

```bash
npm install @desource/phone-mask-nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@desource/phone-mask-nuxt']
});
```

```vue
<script setup>
import { ref } from 'vue';

const phone = ref('');
</script>

<template>
  <PhoneInput v-model="phone" country="US" />
</template>
```

### TypeScript/Vanilla JS

```bash
npm install @desource/phone-mask
```

```ts
import { MasksFullMapEn, formatDigitsWithMap } from '@desource/phone-mask';

const mask = MasksFullMapEn.US.mask[0]; // "###-###-####"
const formatted = formatDigitsWithMap(mask, '2025551234').display;
// Result: "202-555-1234"
```

---

## ✨ Features

- 🌍 **240+ countries** with accurate dialing codes and formats
- 🎭 **Auto-formatting** as you type with smart cursor positioning
- 🔍 **Country search** with fuzzy matching and keyboard navigation
- 🌐 **Auto-detection** via GeoIP and browser locale
- 📋 **Copy to clipboard** with one click
- ✨ **Validation** with visual feedback
- 🎨 **Themeable** (light/dark) with custom styling
- ♿ **Accessible** with ARIA labels and keyboard support
- 📱 **Mobile-optimized** with proper input modes
- 🌳 **Tree-shakeable** — only import what you use
- 🔧 **TypeScript** — full type safety
- 🧩 **Directive mode** for custom input styling

---

## 🎮 Demo

**[Live Demo →](https://phonemask.desource-labs.org)**

Try the interactive playground with:

- Real-time formatting preview
- Country switching
- Theme toggle
- Code examples

---

## 📚 Documentation

- [Core](./packages/phone-mask/README.md)
- [React](./packages/phone-mask-react/README.md)
- [Vue](./packages/phone-mask-vue/README.md)
- [Nuxt](./packages/phone-mask-nuxt/README.md)
- [Svelte](./packages/phone-mask-svelte/README.md)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Quick Contribution Flow

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/phone-mask.git`
3. **Install** dependencies: `pnpm install`
4. **Create** a branch: `git checkout -b feature/my-feature`
5. **Make** your changes
6. **Commit**: `git commit -m "feat: add awesome feature"`
7. **Push**: `git push origin feature/my-feature`
8. **Open** a Pull Request

### Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run unit tests with coverage report
pnpm test:unit:coverage

# Start demo dev server
pnpm dev:prepare
pnpm dev:demo

# Generate fresh data from Google's library
pnpm gen
```

---

## 🌟 Sponsors

Developed and maintained by [DeSource Labs](https://github.com/DeSource-Labs).

<div align="center">
  <a href="https://github.com/DeSource-Labs">
    <img src="https://github.com/DeSource-Labs.png?size=100" width="50" height="50" alt="DeSource Labs">
  </a>
</div>

**Created by [Stefan Popov](https://github.com/stefashkaa)**

---

## 📄 License

[MIT](./LICENSE) © 2026 DeSource Labs

---

## 🔗 Links

- [npm Registry](https://www.npmjs.com/org/desource)
- [GitHub Organization](https://github.com/DeSource-Labs)
- [Issue Tracker](https://github.com/DeSource-Labs/phone-mask/issues)
- [Discussions](https://github.com/DeSource-Labs/phone-mask/discussions)

---

<div align="center">
  <sub>Built with ❤️ by the DeSource Labs team</sub>
</div>
