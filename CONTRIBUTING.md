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

- **Node.js** >= 20.19.0
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
pnpm dev:prepare
pnpm dev:demo
```

Open [http://localhost:3000](http://localhost:3000) to see the demo.

### Running Tests

```bash
# Run unit tests
pnpm test:unit

# Run unit tests with coverage
pnpm test:unit:coverage

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

Source-oriented overview (`dist`, `.nuxt`, `coverage`, `node_modules`, and other generated folders are omitted):

```
phone-mask/
├── packages/
│   ├── phone-mask/              # Core package
│   │   ├── src/
│   │   │   ├── data.json        # Source-of-truth phone metadata
│   │   │   ├── data.min.js      # Generated compact metadata
│   │   │   ├── data-types.ts    # Generated metadata typings
│   │   │   ├── entries.ts       # Static maps/entries exports
│   │   │   ├── formatter.ts
│   │   │   ├── handlers.ts
│   │   │   ├── services/
│   │   │   ├── utils.ts
│   │   │   └── index.ts
│   │   ├── scripts/
│   │   │   └── gen.js           # Metadata generator (Google libphonenumber release artifacts)
│   │   └── tests/
│   │       └── unit/
│
│   ├── phone-mask-react/        # React package
│   │   ├── src/                 # components/, hooks/, types.ts, index.ts
│   │   └── tests/               # unit + e2e
│   │
│   ├── phone-mask-vue/          # Vue package
│   │   ├── src/                 # components/, composables/, directives/, types.ts, index.ts
│   │   └── tests/               # unit + e2e
│   │
│   ├── phone-mask-svelte/       # Svelte package
│   │   ├── src/                 # components/, composables/, directives/, types.ts, index.ts
│   │   └── tests/               # unit + e2e
│   │
│   └── phone-mask-nuxt/         # Nuxt module package
│       ├── src/                 # module.ts + runtime/
│       └── tests/               # unit + e2e fixtures
│
├── common/
│   └── tests/                   # Shared test contracts/utilities for framework packages
│       ├── unit/
│       └── e2e/
│
├── scripts/
│   ├── update-readme-benchmarks.mjs
│   ├── build-coverage-pr-report.mjs
│   └── comment-coverage-pr.mjs

├── demo/                        # Nuxt playground/demo app
│   ├── app/
│   └── nuxt.config.ts
│
├── .changeset/                  # Changesets entries for release notes/versioning
└── .github/
    ├── PULL_REQUEST_TEMPLATE.md
    └── workflows/
        ├── coverage.yml         # Coverage on main + optional manual PR report
        ├── release.yml          # Changesets publish workflow
        ├── weekly-gen.yml       # Weekly metadata sync PR
        └── weekly-benchmarks.yml # Weekly README benchmark refresh PR
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
pnpm dev:prepare
pnpm dev:demo

# Run linting
pnpm lint
pnpm lint:fix

# Format code
pnpm format

# Run tests
pnpm test:unit
pnpm test:unit:coverage
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
- **react:** React package (`@desource/phone-mask-react`)
- **vue:** Vue components (`@desource/phone-mask-vue`)
- **svelte:** Svelte package (`@desource/phone-mask-svelte`)
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
- [ ] Run `pnpm test:unit` — unit tests pass
- [ ] Run `pnpm test:e2e` for changes that affect browser/runtime behavior
- [ ] Update documentation for changed APIs
- [ ] Add tests for new features
- [ ] Add a changeset for publishable package changes (`pnpm changeset`)

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation update
- [ ] Tests
- [ ] Other (describe below):

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

## Manual Coverage (Optional)

Use the coverage workflow button in the PR template to run a manual coverage report for that PR (`pr_number` required, maintainer permissions required).
```

### Review Process

1. **Automated Checks** — CI runs tests and builds
2. **Code Review** — Maintainer reviews code
3. **Feedback** — Address review comments
4. **Approval** — Maintainer approves PR
5. **Merge** — PR is merged to main

### Optional Manual PR Coverage Report (Maintainers)

If you need a package-by-package coverage comment directly in a PR:

1. Open **Actions → Coverage → Run workflow**
2. Select your branch
3. Set `pr_number` to the PR number
4. Run workflow

The PR template includes a direct link to this workflow. This action requires `write/maintain/admin` repository permissions.

## 🚀 Release Process

Releases are managed by maintainers:

### Version Bumping

We use [Semantic Versioning](https://semver.org/):

- **Major (X.0.0):** Breaking changes
- **Minor (1.X.0):** New features (backward compatible)
- **Patch (1.0.X):** Bug fixes (backward compatible)

### Publishing

```bash
# Contributors: create a changeset in your feature PR
pnpm changeset

# Maintainers: when ready to release from main, consume pending changesets
pnpm changeset:version

# Commit with the release trigger message used by CI
git add .
git commit -m "chore: Release packages"
git push origin main
```

Release workflow also supports manual dispatch from GitHub Actions if needed.

## 🎯 Areas We Need Help

- 🧪 **More tests** — Increase coverage
- 📖 **Documentation** — Improve guides and examples
- ♿ **Accessibility** — Enhance ARIA support

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
