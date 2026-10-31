# @desource/phone-mask-nuxt

## 2.0.0

### Major Changes

- Angular Upgrades:
  - Added `@desource/phone-mask-angular` with support for Angular 19–22.
  - Added standalone `PhoneInputComponent`, `PhoneMaskDirective`, headless `usePhoneMask()`, and `PhonePipe`.
  - Added signal inputs, two-way binding, reactive and template-driven Forms integration through `ControlValueAccessor`, SSR, hydration, and zoneless support.
  - Added country selection, localization, component themes, copy and clear actions, and validation feedback.

- Svelte Upgrades:
  - Replaced precompiled component bundles with native Svelte components and rune modules, compiled by the consuming application's Svelte tooling.
  - Removed the precompiled CommonJS component entry.

- Vue/React/Svelte/Nuxt Upgrades:
  - Removed the legacy `.phone-input` and `.phone-dropdown` component classes. Use `.desource-phone-input` and `.desource-phone-dropdown`.

- Vue/Nuxt Upgrades:
  - Deferred initial country, phone, validation, and value-normalization callbacks until mount to prevent SSR side effects and hydration mismatches.

- Nuxt Upgrades:
  - Enabled server rendering for the registered `PhoneInput` component instead of registering it as client-only.
  - Declared `@nuxt/kit` versions `^3.13.2 || ^4.0.0` as a peer dependency, accepting compatible Kit versions used by Nuxt 3 and 4.

- Core/Vue/React/Svelte/Angular/Nuxt Upgrades:
  - Complete international pastes beginning with `+` now detect the country, replace the entire input, and apply the detected country's mask before formatting.
  - International paste detection also applies when `country` is supplied or GeoIP detection is disabled.
  - Prioritized mobile mask variants. Default formatting can change where multiple masks support the same digit count; supported mask sets remain unchanged.

### Minor Changes

- Core Upgrades:
  - Added `detectCountryFromPhone()` for complete international numbers, using calling codes, mask shapes, lengths, and default regions for shared matches.
  - Added `formatPhone()` for display formatting, with optional calling-code and flag output.
  - Added minified and unminified UMD kit builds and an unminified root UMD build for browser/CDN use.
  - Updated formatter configuration typings to accept mask-only metadata.

- React Upgrades:
  - Added the `PMaskPhoneNumber` type alias, matching the other framework packages while preserving `PhoneNumber`.
  - Marked the main component and hook entry with `use client`, keeping core utilities in the separate `/core` entry.

- Vue/React/Svelte/Angular Upgrades:
  - Added an accessible country-search clear button.
  - Added framework-specific demo examples and display-formatting examples.

### Patch Changes

- Core/Vue/React/Svelte/Angular/Nuxt Upgrades:
  - Fixed typing over selected digits when the input has reached its maximum length.
  - Fixed caret placement during deletion when the active mask differs from the mask inferred from the caret's digit index.
  - Prevented delayed country detection from overwriting user edits, clearing, pasted countries, or subsequent country selections.
  - Expanded shared input, country-detection, and editing regression coverage.

- Vue/React/Svelte/Angular/Nuxt Upgrades:
  - Improved SSR and hydration handling for browser APIs, dropdown initialization, locale, theme, and custom content.
  - Improved country-selector accessibility with combobox semantics, labeled country lists, calling codes in selector labels, and empty-result announcements.
  - Corrected search-clear button positioning and focus styling.
  - Expanded SSR, hydration, accessibility, and framework integration tests.

- Core/Vue/React Upgrades:
  - Added separate ESM and CommonJS declaration entry points and corrected package export resolution.
  - Preserved readable library output for consumer bundlers and improved tree-shaking.

- Core Upgrades:
  - Improved generated mask-data compression and separated flag conversion from country-data initialization.

- Vue/React/Svelte Upgrades:
  - Marked component CSS as a side effect so bundlers preserve imported styles.

- Vue/React Upgrades:
  - Restored compatibility with the declared Vue 3.4 and React 18 peer ranges.

- Documentation and Tooling:
  - Corrected core validation and backend-payload recipes to preserve compact international numbers, remove only matching calling codes, and retain intentional input truncation.
  - Corrected React type and controlled-input examples.
  - Updated mask-ordering, mask-selection, and UK formatting examples.
  - Updated build, framework, test, and release dependencies and pnpm to 12.16.1.

- Updated dependencies []:
  - @desource/phone-mask-vue@2.0.0

### Migration from 1.7.0

- Update the Phone Mask packages used by your application together to 2.0.0.

- Replace legacy component selectors in CSS, tests, and DOM queries:
  - `.phone-input` → `.desource-phone-input`
  - `.phone-dropdown` → `.desource-phone-dropdown`

- Svelte applications must compile the package through Svelte-aware tooling, such as SvelteKit or the Svelte Vite plugin. Keep using the public package imports and `@desource/phone-mask-svelte/assets/lib.css`. Replace reliance on precompiled CommonJS component bundles.

- Nuxt 3 and 4 applications must satisfy the `@nuxt/kit` peer range `^3.13.2 || ^4.0.0`. Kit 3.13.2 is the first version that exports the module's required `isNuxtMajorVersion` helper. `PhoneInput` now renders on the server, so custom content must support SSR. Use `<ClientOnly>` when application-specific content intentionally requires browser APIs.

- Vue/Nuxt applications should initialize server-rendered state directly rather than relying on initial callbacks. Those callbacks now run after mount. Supply `country`, `locale`, and `theme` explicitly when the initial server-rendered appearance must be controlled.

- Review fixed-country paste assumptions. A recognized complete international paste replaces the whole value and can change the country even when `country` is supplied. `detect: false` disables GeoIP detection, not international paste detection.

- Review formatting snapshots and stored display strings where mask ordering matters. Mobile variants now take priority; raw digits and calling codes remain unchanged.

- Replace direct imports from internal build or declaration paths with documented package entry points. Core utilities remain available through `@desource/phone-mask/kit`; framework utilities use their documented `/core` subpaths.

- For custom formatter configuration, use `createPhoneFormatter(country)` or `createPhoneFormatter({ mask: country.mask })`. Additional fields in an inline object literal are no longer part of the formatter configuration type.

- React consumers can use `PMaskPhoneNumber` for consistent naming across frameworks. Existing `PhoneNumber` imports continue to work.

## 1.7.0

### Minor Changes

- Core/Vue/React/Svelte/Nuxt Upgrades:
  - Refreshed README benchmarks, documentation links, and CodeWiki, Context7, and DeepWiki badges; removed unstable Bundlephobia size badges.
  - Simplified repository package directories to `core`, `vue`, `react`, `svelte`, and `nuxt`, preserving published package names and public imports.
  - Updated repository links, TypeScript configuration, coverage reporting, and release scripts for the new directory structure.
  - Consolidated benchmark retry and concurrency helpers and parallelized independent file operations in benchmark and changelog scripts.

- Vue/React/Svelte Upgrades:
  - Simplified country-option forwarding in `usePhoneMask`.
  - Consolidated framework demo styles and shared end-to-end playground controls.

- Vue/Svelte Upgrades:
  - Made intentional background country detection and deferred caret updates explicit in composables and directives.

### Patch Changes

- Core/Vue/React/Svelte/Nuxt Upgrades:
  - Updated build, lint, test, release, and framework dependencies within compatible peer ranges and pnpm release-age rules.
  - Updated pnpm to 12.10.1.
  - Updated transitive dependencies to resolve production audit findings in `source-map-js` and `sharp`.
  - Refactored core input-handler and country-selector tests and simplified shared unit-test callbacks while preserving React's asynchronous `act` boundary.

- Nuxt Upgrades:
  - Updated Nuxt and its kit to 4.6.0 and refreshed test utilities.
  - Consolidated generated import and component registration assertions across end-to-end fixtures.

- Updated dependencies []:
  - @desource/phone-mask-vue@1.7.0

## 1.6.4

### Patch Changes

- Core/Vue/React/Svelte/Nuxt Upgrades:
  - Refreshed package tooling for builds, linting, tests, and releases, including pnpm 12 and Vitest 5.
  - Updated React, Vue, and Svelte development dependencies and Nuxt test utilities within compatible peer ranges.
  - Adjusted unit and end-to-end test setup for the updated tooling.

- Updated dependencies []:
  - @desource/phone-mask-vue@1.6.4

## 1.6.3

### Patch Changes

- Core/Vue/React/Svelte/Nuxt Upgrades:
  - Updated development dependencies across build, lint, test, release, and framework tooling.

- Updated dependencies []:
  - @desource/phone-mask-vue@1.6.3

## 1.6.2

### Patch Changes

- Core/Vue/React/Svelte/Nuxt Upgrades:
  - Updated development dependencies across build, lint, test, and framework tooling.

- Updated dependencies []:
  - @desource/phone-mask-vue@1.6.2

## 1.6.1

### Patch Changes

- Core Upgrades:
  - Sync country masks with google-libphonenumber (🇫🇴 Faroe Islands updates)

- Updated dependencies []:
  - @desource/phone-mask-vue@1.6.1

## 1.6.0

### Minor Changes

- React Upgrades:
  - Improved `PhoneInput` SSR support by deferring dropdown portal rendering until the component is mounted, avoiding server-side `document.body` access during render.
  - Preserved country selector portal behavior by rendering the dropdown into `document.body` after mount.

- Vue/React/Svelte/Nuxt Upgrades:
  - Improved default copy icon visuals across framework `PhoneInput` components.
  - Compressed default copy, copied, and clear SVG paths without changing public customization props or slots.

### Patch Changes

- Updated dependencies []:
  - @desource/phone-mask-vue@1.6.0

## 1.5.0

### Minor Changes

- Vue/React/Svelte Upgrades:
  - Improved `PhoneInput` DOM structure across framework packages for more consistent styling, accessibility, and test coverage.
  - Added stable public CSS hooks: `.desource-phone-input` and `.desource-phone-dropdown`.
  - Preserved existing `.phone-input` and `.phone-dropdown` classes for backward compatibility.
  - Moved duplicated framework styles into a shared SCSS implementation and aligned CSS build output across Vue, React, and Svelte packages.
  - Improved screen reader live region styling and dropdown search autofill handling.
  - Added shared unit and e2e coverage for structure, ARIA attributes, dropdown placement, style scope markers, and visually hidden announcements.

- Nuxt Upgrades:
  - Updated styling documentation to use the new Vue package CSS hooks and current CSS variables.

### Patch Changes

- Updated dependencies []:
  - @desource/phone-mask-vue@1.5.0

## 1.4.1

### Patch Changes

- Core/Vue/React/Svelte/Nuxt Upgrades:
  - Made an internal tooling update
  - Updated development environment dependencies for better stability and security

- Updated dependencies []:
  - @desource/phone-mask-vue@1.4.1

## 1.4.0

### Minor Changes

- Core Upgrades:
  - Added `@desource/phone-mask/kit` subpath for formatter, handlers, services, utilities, and shared country selector helpers
  - Root `@desource/phone-mask` now focuses on country mask entries/data. Helper, formatter, handler, service, and utility imports should use `@desource/phone-mask/kit`
  - Added shared country selector DOM, positioning, keyboard, and focus helpers used by framework packages

- Vue/React/Svelte Upgrades:
  - Rebuilt the country selector dropdown with stable body-rendered fixed positioning using Portal/Teleport patterns
  - Improved dropdown UX across desktop and mobile: viewport-aware above/below placement, body-level rendering, outside-click close, Escape close, focus restore, search keyboard navigation, and empty-results keyboard safety
  - Improved dropdown accessibility semantics by exposing the selector popup as a searchable dialog with listbox options
  - Aligned country selector behavior and tests across React, Vue, and Svelte through shared common/core helpers

- React Upgrades:
  - Simplified internal memoization and callback usage where it reduced bundle/runtime overhead without changing behavior

- Svelte Upgrades:
  - Cleaned up event listener and attachment typings for newer Svelte/TypeScript tooling

### Patch Changes

- Updated dependencies []:
  - @desource/phone-mask-vue@1.4.0

## 1.3.1

### Patch Changes

- Core Upgrades:
  - Sync country masks with google-libphonenumber (🇸🇰 Slovakia updates)

- Updated dependencies []:
  - @desource/phone-mask-vue@1.3.1

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
  - @desource/phone-mask-vue@1.3.0

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
  - @desource/phone-mask-vue@1.2.0

## 1.1.2

### Patch Changes

- Vue/React/Svelte Upgrades:
  - Reduced package bundle size (optimized build output)
  - No API changes

- Updated dependencies []:
  - @desource/phone-mask-vue@1.1.2

## 1.1.1

### Patch Changes

- Core Upgrades:
  - Optimized bundle size of core package

- Updated dependencies []:
  - @desource/phone-mask-vue@1.1.1

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
  - @desource/phone-mask-vue@1.1.0

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
  - @desource/phone-mask-vue@1.0.0

## 0.3.0

### Minor Changes

- React: Design React version of phone-mask library
- Core: Add geoip reusable service for country detection based on IP address

### Patch Changes

- Updated dependencies []:
  - @desource/phone-mask-vue@0.3.0

## 0.2.3

### Patch Changes

- Vue: Improve country dropdown scroll

- Updated dependencies []:
  - @desource/phone-mask-vue@0.2.3

## 0.2.2

### Patch Changes

- Core: Sync country masks with google-libphonenumber (Morocco & Western Sahara updates)

- Updated dependencies []:
  - @desource/phone-mask-vue@0.2.2

## 0.2.1

### Patch Changes

- Nuxt: Improve install process of the package
- Vue: Improve locale init of PhoneMask

- Updated dependencies []:
  - @desource/phone-mask-vue@0.2.1

## 0.2.0

### Minor Changes

- Initial release of phone-mask monorepo packages
  - Core phone masking library with Google libphonenumber integration
  - Vue 3 component and directive for phone input
  - Nuxt module with zero-config setup

### Patch Changes

- Updated dependencies []:
  - @desource/phone-mask-vue@0.2.0
