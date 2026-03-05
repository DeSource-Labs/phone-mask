# Contributing to Phone Mask

First off, thank you for considering contributing to Phone Mask! It's people like you that make open source such a great community. 🎉

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How Can I Contribute?](#-how-can-i-contribute)
- [Development Setup](#-development-setup)
- [Project Structure](#-project-structure)
- [Development Workflow](#-development-workflow)
- [Coding Standards](#-coding-standards)
- [Commit Guidelines](#-commit-guidelines)
- [Pull Request Process](#-pull-request-process)
- [Release Process](#-release-process)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [hello@desource-labs.org](mailto:hello@desource-labs.org).

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/DeSource-Labs/phone-mask/issues) to avoid duplicates.

When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, browser, versions)
- **Code samples** (minimal reproduction)

**Example:**

```markdown
## Bug: Placeholder not updating on country change

**Steps:**

1. Select "United States"
2. Type phone number
3. Change country to "United Kingdom"

**Expected:** Placeholder updates to UK format
**Actual:** Placeholder remains US format

**Environment:**

- Browser: Chrome 120
- Vue: 3.4.0
- @desource/phone-mask-vue: 1.0.0
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** — why is this needed?
- **Proposed solution**
- **Alternatives considered**
- **Examples from other libraries** (if applicable)

### Pull Requests

We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`
2. Make your changes
3. Add tests if applicable
4. Ensure tests pass
5. Update documentation
6. Submit your pull request!

## 🛠️ Development Setup

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 10.0.0

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/phone-mask.git
cd phone-mask

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development Server

```bash
# Start demo with hot reload
pnpm dev:demo
```

Open [http://localhost:3000](http://localhost:3000) to see the demo.

### Running Tests

```bash
# Run unit tests
pnpm test:unit

# Run E2E tests
pnpm test:e2e
```

### Linting and Formatting

We use ESLint and Prettier to maintain code quality and consistency:

```bash
# Check for lint errors
pnpm lint

# Fix lint errors automatically
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check formatting without writing
pnpm format:check
```

**Editor Integration:**

- Install ESLint and Prettier extensions for VS Code
- Enable "Format on Save" in your editor
- The project includes `.prettierrc` and `.prettierignore` for consistent formatting

## 📁 Project Structure

```
phone-mask/
├── packages/
│   ├── phone-mask/            # Core TypeScript library
│   │   ├── src/
│   │   │   ├── data.json      # Phone mask data written automatically by script
│   │   │   ├── data.min.js    # Phone mask data written automatically by script
│   │   │   ├── data-types.ts  # Phone mask types written automatically by script
│   │   │   ├── utils.ts       # Utility functions
│   │   │   ├── entries.ts     # Core exports
│   │   │   └── index.ts       # Public API
│   │   ├── scripts/
│   │   │   └── gen.js         # Data generator
│   │   └── package.json
│   │
│   ├── phone-mask-vue/        # Vue 3 components
│   │   ├── src/
│   │   │   ├── components/    # Vue components
│   │   │   ├── directives/    # Vue directives
│   │   │   ├── composables/   # Vue composables
│   │   │   ├── consts.ts      # Constants
│   │   │   ├── types.ts       # TypeScript types
│   │   │   └── index.ts       # Public API
│   │   └── package.json
│   │
│   └── phone-mask-nuxt/       # Nuxt module
│       ├── src/
│       │   ├── runtime/                   # Nuxt runtime files
│       │   │   ├── component.ts           # Auto-registered component
│       │   │   ├── plugin.phone-mask.ts   # Auto-registered directive plugin
│       │   │   └── shared.ts              # Auto-registered shared utilities
│       │   └── module.ts
│       └── package.json
│
├── demo/                      # Demo application
│   ├── app/
│   │   ├── components/
│   │   ├── pages/
│   │   └── composables/
│   └── nuxt.config.ts
│
└── .github/
    └── workflows/
        └── weekly-gen.yml     # Auto-sync workflow
```

## 🔄 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/amazing-feature
# or
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing patterns
- Add tests for new features
- Update documentation

### 3. Test Your Changes

```bash
# Build packages
pnpm build

# Run demo to verify visually
pnpm dev:demo

# Run linting
pnpm lint
pnpm lint:fix

# Format code
pnpm format

# Run tests
pnpm test:unit
pnpm test:e2e
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add amazing feature"
```

See [Commit Guidelines](#commit-guidelines) for commit message format.

### 5. Push and Create PR

```bash
git push origin feature/amazing-feature
```

Then open a Pull Request on GitHub.

## 📏 Coding Standards

We use **ESLint** and **Prettier** to enforce consistent code style. Run `pnpm lint` and `pnpm format` before committing.

### TypeScript

- **Use TypeScript** for all new code
- **Export types** for public APIs
- **Avoid `any`** — use proper types
- **Document complex types** with JSDoc

**Example:**

```ts
/**
 * Format digits according to mask template
 * @param template - Mask template with # placeholders
 * @param digits - Raw digit string
 * @returns Formatted display and index map
 */
export function formatDigitsWithMap(template: string, digits: string): FormatResult {
  // Implementation
}
```

### Vue

- **Use Composition API** with `<script setup>`
- **TypeScript** in all components
- **Props interface** for all components
- **Emit types** for all events

**Example:**

```vue
<script setup lang="ts">
interface Props {
  modelValue?: string;
  country?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'country-change', country: MaskFull): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  country: 'US'
});

const emit = defineEmits<Emits>();
</script>
```

### CSS

- **Use CSS custom properties** for themeable values
- **Mobile-first** responsive design
- **Accessible** — proper contrast, focus states
- **BEM naming** for component styles

```css
.pi-input {
  /* Use CSS variables */
  background: var(--pi-bg);
  border: 1px solid var(--pi-border);

  /* Focus states */
  &:focus {
    border-color: var(--pi-border-focus);
    outline: none;
  }
}
```

### File Naming

- **Components:** PascalCase (e.g., `PhoneInput.vue`)
- **Composables:** camelCase with `use` prefix (e.g., `useMask.ts`)
- **Utilities:** camelCase (e.g., `formatUtils.ts`)
- **Types:** PascalCase (e.g., `MaskEntry.ts`)

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation only
- **style:** Code style (formatting, missing semi-colons, etc.)
- **refactor:** Code change that neither fixes a bug nor adds a feature
- **perf:** Performance improvement
- **test:** Adding or updating tests
- **chore:** Maintenance tasks (dependencies, build, etc.)

### Scopes

- **core:** Core library (`@desource/phone-mask`)
- **vue:** Vue components (`@desource/phone-mask-vue`)
- **nuxt:** Nuxt module (`@desource/phone-mask-nuxt`)
- **demo:** Demo application
- **docs:** Documentation
- **ci:** CI/CD workflows

### Examples

```bash
# New feature
git commit -m "feat(vue): add dark theme support"

# Bug fix
git commit -m "fix(core): correct GB phone mask format"

# Documentation
git commit -m "docs(readme): add migration guide"

# Breaking change
git commit -m "feat(vue)!: change prop name from 'value' to 'modelValue'

BREAKING CHANGE: Renamed 'value' prop to 'modelValue' for v-model support"
```

## 🔀 Pull Request Process

### Before Submitting

- [ ] Run `pnpm build` — all packages build successfully
- [ ] Run `pnpm test:e2e` — all tests pass
- [ ] Update documentation for changed APIs
- [ ] Add tests for new features
- [ ] Update CHANGELOG.md (if applicable)

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation update

## Testing

Describe how you tested your changes

## Screenshots (if applicable)

Add screenshots for UI changes

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

### Review Process

1. **Automated Checks** — CI runs tests and builds
2. **Code Review** — Maintainer reviews code
3. **Feedback** — Address review comments
4. **Approval** — Maintainer approves PR
5. **Merge** — PR is merged to main

## 🚀 Release Process

Releases are managed by maintainers:

### Version Bumping

We use [Semantic Versioning](https://semver.org/):

- **Major (X.0.0):** Breaking changes
- **Minor (1.X.0):** New features (backward compatible)
- **Patch (1.0.X):** Bug fixes (backward compatible)

### Publishing

```bash
# Create a changeset for your package updates
pnpm changeset

# Apply versions and changelog updates from pending changesets
pnpm changeset:version

# Build all packages
pnpm build

# Publish updated packages
pnpm changeset:publish
```

## 🎯 Areas We Need Help

- 🧱 **Core package tests** — Expand direct tests for `@desource/phone-mask`
- 🧪 **More tests** — Increase coverage
- 🌍 **Localization** — Add more locale support
- 📖 **Documentation** — Improve guides and examples
- ♿ **Accessibility** — Enhance ARIA support
- 🎨 **Themes** — Create more theme presets

## 💬 Community

- **GitHub Discussions:** [Ask questions, share ideas](https://github.com/DeSource-Labs/phone-mask/discussions)
- **Issues:** [Report bugs, request features](https://github.com/DeSource-Labs/phone-mask/issues)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort! ❤️

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/DeSource-Labs">DeSource Labs</a></sub>
</div>
