# @desource/phone-mask-vue

## 1.3.0

### Minor Changes

- Core Upgrades:
  - Improved process keydown event handler for browser autocomplete cases

- Vue Upgrades:
  - Added new `@desource/phone-mask-vue/core` subpath export (direct core helpers re-export)
  - Root `PMaskHelpers` facade removed from index (helpers now via `/core` to reduce bundle size impact for Vue users)
  - Added `id` and `name` props on `PhoneInput`, passed to underlying `<input>` element for better form integration and accessibility
  - Added autofill style normalization (`-webkit-autofill` / `-moz-autofill`) for better visual consistency

- React Upgrades:
  - Added new `@desource/phone-mask-react/core` subpath export (direct core helpers re-export)
  - Root `PMaskHelpers` facade removed from index (helpers now via `/core` to reduce bundle size impact for React users)
  - Added `id` and `name` props on `PhoneInput`, passed to underlying `<input>` element for better form integration and accessibility
  - Added autofill style normalization (`-webkit-autofill` / `-moz-autofill`) for better visual consistency
  - `useCountrySelector`, `useClipboard` internals stabilized (deps/callback consistency improvements)
  - `usePhoneMask` callback dependency tuning for better stability

- Svelte Upgrades:
  - Added new `@desource/phone-mask-svelte/core` subpath export (direct core helpers re-export)
  - Root `PMaskHelpers` facade removed from index (helpers now via `/core` to reduce bundle size impact for Svelte users)
  - Added `id` and `name` props on `PhoneInput`, passed to underlying `<input>` element for better form integration and accessibility
  - Added autofill style normalization (`-webkit-autofill` / `-moz-autofill`) for better visual consistency

- Nuxt Upgrades:
  - Module options expanded and clarified:
    - `types` (default `true`): auto-import types from packages for TypeScript users
    - `helpers` (default `false`): auto-import core helpers for direct usage in Nuxt apps (optional due to potential bundle size impact)
    - new: `composable` (default `false`): auto-import Vue composable for custom phone mask logic (optional for users who only need more custom solution than the provided component/directive)
  - Default auto-imports now focus on component/directive/types; helpers/composable are opt-in
  - Runtime shared exports updated:
    - `usePhoneMask` (composable) is now a separate export from `phoneMaskDirective` and `PhoneInput` component for more flexible usage patterns
    - `PMaskHelpers` sourced via `@desource/phone-mask-vue/core` for better tree-shaking and bundle size control

### Patch Changes

- Updated dependencies []:
  - @desource/phone-mask@1.3.0

## 1.2.0

### Minor Changes

- Core Upgrades:
  - Core metadata minification redesigned for better performance and reliability
  - Breaking changes (minor impact):
    - Core mask shape normalized: `mask` is now always `string[]` (no `string | string[]` union) across core types/exports
    - `toArray` removed from all packages
  - Formatter edge case fixed: countries with no mask variants are now handled safely (`maxDigits = 0` path)

### Patch Changes

- Updated dependencies []:
  - @desource/phone-mask@1.2.0

## 1.1.2

### Patch Changes

- Vue/React/Svelte Upgrades:
  - Reduced package bundle size (optimized build output)
  - No API changes

- Updated dependencies []:
  - @desource/phone-mask@1.1.2

## 1.1.1

### Patch Changes

- Core Upgrades:
  - Optimized bundle size of core package

- Updated dependencies []:
  - @desource/phone-mask@1.1.1

## 1.1.0

### Minor Changes

- Svelte Upgrades:
  - Added attachment `phoneMaskAttachment` for usage in native input (for Svelte 5.29+ versions)
  - Added action `phoneMaskAction` for usage in native input (for Svelte 5.0+ versions)
  - Improved keyboard country selection flow and active-descendant accessibility behavior
  - Refined dropdown/key navigation handling and related focus behavior
  - `usePhoneMask` now exposes `formatter` in the return object

- Vue Upgrades:
  - Directive was refactored to align with Svelte action
  - Improved keyboard country selection flow and active-descendant accessibility behavior
  - Refined dropdown/key navigation handling and related focus behavior
  - `usePhoneMask` now exposes `formatter` in the return object

- React Upgrades:
  - Improved keyboard country selection flow and active-descendant accessibility behavior
  - Refined dropdown/key navigation handling and related focus behavior
  - `usePhoneMask` now exposes `formatter` in the return object

- Core Upgrades:
  - Fixed edge cases in mask variant selection and improved input handler robustness
  - Applied reliability-focused refactors in formatter/handlers and build script generation logic

### Patch Changes

- Updated dependencies []:
  - @desource/phone-mask@1.1.0

## 1.0.0

### Major Changes

- Core Upgrades:
  - Refactored core architecture for better separation of concerns and reusability
  - Added zero-config browser script support path
  - Improved Intl.DisplayNames caching for performance
  - Fixed various edge cases in formatting and event handling
  - Added comprehensive unit tests for core utilities and handlers

- React Upgrades:
  - Major internal refactor to a controlled pattern with consistent hooks
  - Improved React 18/19 compatibility for ref behavior
  - Added and expanded unit/e2e tests for React components and behavior

- Vue Upgrades:
  - Refactored to align composable structure and reuse core utilities
  - Fixed directive behavior for external value updates and dropdown close logic
  - Added substantial unit/e2e test coverage for Vue composables and directive

- 🚀 Svelte Upgrades:
  - Introduced Svelte version of phone-mask library

- Nuxt Upgrades:
  - Added full test foundation with @nuxt/test-utils
  - Added unit tests for module and runtime behavior
  - Added e2e fixtures/tests and shared e2e utilities

### Patch Changes

- Updated dependencies []:
  - @desource/phone-mask@1.0.0

## 0.3.0

### Minor Changes

- React: Design React version of phone-mask library
- Core: Add geoip reusable service for country detection based on IP address

### Patch Changes

- Updated dependencies []:
  - @desource/phone-mask@0.3.0

## 0.2.3

### Patch Changes

- Vue: Improve country dropdown scroll

- Updated dependencies []:
  - @desource/phone-mask@0.2.3

## 0.2.2

### Patch Changes

- Core: Sync country masks with google-libphonenumber (Morocco & Western Sahara updates)

- Updated dependencies []:
  - @desource/phone-mask@0.2.2

## 0.2.1

### Patch Changes

- Nuxt: Improve install process of the package
- Vue: Improve locale init of PhoneMask

- Updated dependencies []:
  - @desource/phone-mask@0.2.1

## 0.2.0

### Minor Changes

- Initial release of phone-mask monorepo packages
  - Core phone masking library with Google libphonenumber integration
  - Vue 3 component and directive for phone input
  - Nuxt module with zero-config setup

### Patch Changes

- Updated dependencies []:
  - @desource/phone-mask@0.2.0
