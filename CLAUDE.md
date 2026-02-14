# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Phone Mask is a monorepo containing international phone masking libraries with auto-sync to Google's libphonenumber. The repository includes a framework-agnostic core and bindings for React, Vue 3, and Nuxt.

## Common Development Commands

### Building and Development

```bash
# Build all packages in the monorepo
pnpm build

# Clean all build artifacts
pnpm clean

# Start demo development server (http://localhost:3000)
pnpm dev:demo

# Prepare demo dependencies (required before first demo build)
pnpm dev:prepare

# Build demo for production
pnpm build:demo
```

### Data Generation

```bash
# Regenerate phone mask data from latest Google libphonenumber
# This updates data.json, data.min.js, and data-types.ts in packages/phone-mask/src/
pnpm gen
```

### Code Quality

```bash
# Lint all code
pnpm lint

# Auto-fix linting issues
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check formatting without writing
pnpm format:check
```

### Testing

```bash
# Run E2E tests (referenced in CONTRIBUTING.md)
pnpm test:e2e

# Run tests in UI mode
pnpm test:e2e:ui

# View test report
pnpm test:e2e:report
```

### Version Management and Publishing

```bash
# Create a changeset (for tracking changes)
pnpm changeset

# Bump versions based on changesets
pnpm changeset:version

# Publish packages to npm
pnpm changeset:publish

# Full release workflow (version + publish)
pnpm release
```

## Architecture

### Monorepo Structure

This is a **pnpm workspace** monorepo with 4 packages:

1. **`@desource/phone-mask`** (core) - Framework-agnostic TypeScript library
   - Exports phone mask data and formatting utilities
   - Contains auto-generated files (`data.json`, `data.min.js`, `data-types.ts`) created by `scripts/gen.js`
   - Key exports: `MasksBaseMap`, `MasksMap`, `MasksFull`, formatting utilities

2. **`@desource/phone-mask-react`** - React bindings
   - Depends on core via `workspace:*`
   - Exports `PhoneInput` component and `usePhoneMask` hook
   - Built with Vite, outputs ESM and CJS

3. **`@desource/phone-mask-vue`** - Vue 3 bindings
   - Depends on core via `workspace:*`
   - Exports `PhoneInput` component, `vPhoneMask` directive, and composables
   - Uses Vue Composition API with `<script setup>`

4. **`@desource/phone-mask-nuxt`** - Nuxt module
   - Depends on Vue package via `workspace:*`
   - Provides auto-imported components and runtime utilities
   - Built with Nuxt Module Builder

### Data Generation Workflow

The `packages/phone-mask/scripts/gen.js` script:
- Installs latest `google-libphonenumber` as devDependency
- Extracts example numbers for each country and phone type
- Converts formatted examples to mask templates (e.g., `+1 (###)###-####`)
- Generates three files in `packages/phone-mask/src/`:
  - `data.json` - Human-readable JSON mapping
  - `data.min.js` - Minified ES module export
  - `data-types.ts` - TypeScript type union of all country codes

**Do not manually edit** `data.json`, `data.min.js`, or `data-types.ts` - they are auto-generated.

### Core Library Organization

**`packages/phone-mask/src/`**:
- `entries.ts` - Main data exports (MasksBaseMap, MasksMap, etc.), derives different formats from raw data
- `utils.ts` - Formatting utilities (`formatDigitsWithMap`, `pickMaskVariant`, etc.)
- `country-code-emodji.ts` - Country flag emoji mappings
- `index.ts` - Public API barrel export

### Framework Package Patterns

**React** (`packages/phone-mask-react/src/`):
- `components/PhoneInput.tsx` - Main component
- `hooks/usePhoneMask.ts` - React hook for phone masking logic
- `types.ts` - TypeScript interfaces
- `utils.ts` - React-specific utilities

**Vue** (`packages/phone-mask-vue/src/`):
- `components/PhoneInput.vue` - Main component
- `composables/` - Vue composables (useMask, usePhoneFormatter, useCountrySelector, useClipboard)
- `directives/vPhoneMask.ts` - Vue directive for custom input styling
- `types.ts` - TypeScript interfaces

**Nuxt** (`packages/phone-mask-nuxt/src/`):
- `module.ts` - Nuxt module definition
- `runtime/` - Auto-registered components, plugins, and shared utilities

### Build System

- All packages use **Vite** for building
- TypeScript compilation with `tsc` for type declarations
- Core package: outputs ESM (`dist/esm/`) and CJS (`dist/phone-mask.cjs.js`)
- React package: outputs ESM, CJS, and bundled CSS (`dist/style.css`)
- Vue package: outputs ESM and bundled CSS
- Nuxt module: built with `@nuxt/module-builder`

## Code Standards

### Commit Messages

Follow **Conventional Commits** format:

```
<type>(<scope>): <subject>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Scopes**: `core`, `vue`, `react`, `nuxt`, `demo`, `docs`, `ci`

**Examples**:
- `feat(react): add dark theme support`
- `fix(core): correct GB phone mask format`
- `docs(readme): add migration guide`

### TypeScript

- Use TypeScript for all new code
- Export types for public APIs
- Avoid `any` - use proper types
- Document complex types with JSDoc

### Vue Components

- Use **Composition API** with `<script setup>`
- Define props with TypeScript interfaces
- Type all emits

### File Naming

- Components: PascalCase (e.g., `PhoneInput.vue`)
- Composables: camelCase with `use` prefix (e.g., `useMask.ts`)
- Utilities: camelCase (e.g., `utils.ts`)
- Types: PascalCase (e.g., `types.ts`)

## Important Notes

### Workspace Dependencies

Framework packages depend on core using `workspace:*` protocol in package.json. When making changes:
1. Build core first: `cd packages/phone-mask && pnpm build`
2. Then build dependent packages: `pnpm build` (from root)

### Auto-Generated Files

Never manually edit these files in `packages/phone-mask/src/`:
- `data.json`
- `data.min.js`
- `data-types.ts`

These are generated by `pnpm gen` and will be overwritten.

### Demo Application

The `demo/` directory is a Nuxt application that showcases all packages. It's useful for:
- Visual testing of changes
- Verifying cross-package integration
- Generating production demo site

### Tree-Shakeable Exports

The core library is designed for tree-shaking. Users should be able to import only what they need. Maintain this by:
- Using named exports (not default exports) in core
- Avoiding side effects (package.json has `"sideEffects": false`)
- Keeping utilities pure and independent

### Package Publishing

Releases use Changesets workflow:
1. Create changeset: `pnpm changeset` (select packages and change type)
2. Commit changeset files
3. On merge to main, CI creates "Version Packages" PR
4. Merging that PR triggers publish to npm

Do not manually edit version numbers in package.json files.
