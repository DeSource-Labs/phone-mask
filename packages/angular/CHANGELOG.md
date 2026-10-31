# @desource/phone-mask-angular

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
  - @desource/phone-mask@2.0.0
