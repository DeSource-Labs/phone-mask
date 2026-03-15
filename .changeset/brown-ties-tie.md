---
'@desource/phone-mask-svelte': minor
'@desource/phone-mask-react': minor
'@desource/phone-mask-vue': minor
'@desource/phone-mask': minor
'@desource/phone-mask-nuxt': minor
---

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
