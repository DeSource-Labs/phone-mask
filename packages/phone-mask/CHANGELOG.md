# @desource/phone-mask

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

## 0.3.0

### Minor Changes

- React: Design React version of phone-mask library
- Core: Add geoip reusable service for country detection based on IP address

## 0.2.3

### Patch Changes

- Vue: Improve country dropdown scroll

## 0.2.2

### Patch Changes

- Core: Sync country masks with google-libphonenumber (Morocco & Western Sahara updates)

## 0.2.1

### Patch Changes

- Nuxt: Improve install process of the package
- Vue: Improve locale init of PhoneMask

## 0.2.0

### Minor Changes

- Initial release of phone-mask monorepo packages
  - Core phone masking library with Google libphonenumber integration
  - Vue 3 component and directive for phone input
  - Nuxt module with zero-config setup
