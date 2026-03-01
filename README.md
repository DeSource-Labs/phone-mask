<div align="center">
  <h1>📱 Phone Mask</h1>
  <p><strong>Always-fresh, extreme small & easy-to-use international phone masking with Google's libphonenumber data</strong></p>

  <p>
    <a href="https://www.npmjs.com/package/@desource/phone-mask"><img src="https://img.shields.io/npm/v/@desource/phone-mask?color=blue&logo=npm" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@desource/phone-mask"><img src="https://img.shields.io/npm/dm/@desource/phone-mask?color=green" alt="npm downloads"></a>
    <a href="https://bundlephobia.com/package/@desource/phone-mask"><img src="https://img.shields.io/bundlephobia/minzip/@desource/phone-mask?label=gzip%20size&color=purple" alt="bundle size"></a>
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

### 🪶 Lightest in Class

**13 KB total** (4 KB gzipped) with full tree-shaking support. Compare to alternatives:

| Library                  | Bundle Size (minified) | Gzipped  |
| ------------------------ | ---------------------- | -------- |
| **@desource/phone-mask** | **13 KB**              | **4 KB** |
| react-phone-input-2      | ~80 KB                 | ~25 KB   |
| react-phone-number-input | ~40 KB                 | ~15 KB   |
| intl-tel-input           | ~180 KB                | ~55 KB   |

### 🎨 Framework-Ready

Ready-made plugins for your stack:

- ✅ **Vue 3** — Composition API component + directive
- ✅ **Nuxt** — Auto-imported, SSR-compatible
- ✅ **React** — Component & hook with modern React patterns
- ✅ **Svelte** — Component & rune for Svelte 5
- ✅ **TypeScript/Vanilla JS** — Framework-agnostic core

---

## 📦 Packages

| Package                                                     | Version                                                                     | Description                  |
| ----------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------- |
| [@desource/phone-mask](./packages/phone-mask)               | ![npm](https://img.shields.io/npm/v/@desource/phone-mask?color=blue)        | Core library — TypeScript/JS |
| [@desource/phone-mask-react](./packages/phone-mask-react)   | ![npm](https://img.shields.io/npm/v/@desource/phone-mask-react?color=blue)  | React component + hook       |
| [@desource/phone-mask-vue](./packages/phone-mask-vue)       | ![npm](https://img.shields.io/npm/v/@desource/phone-mask-vue?color=blue)    | Vue 3 component + directive  |
| [@desource/phone-mask-svelte](./packages/phone-mask-svelte) | ![npm](https://img.shields.io/npm/v/@desource/phone-mask-svelte?color=blue) | Svelte 5 component + rune    |
| [@desource/phone-mask-nuxt](./packages/phone-mask-nuxt)     | ![npm](https://img.shields.io/npm/v/@desource/phone-mask-nuxt?color=blue)   | Nuxt module                  |

---

## ⚡ Quick Start

### React

```bash
npm install @desource/phone-mask-react
```

```tsx
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

<template>
  <PhoneInput bind:value={phone} country="US" />
</template>
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

const mask = MasksFullMapEn.US.mask; // "+1 ###-###-####"
const formatted = formatDigitsWithMap(mask, '2025551234');
// Result: "+1 202-555-1234"
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

# Start demo dev server
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
