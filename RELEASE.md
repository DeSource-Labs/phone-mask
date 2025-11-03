# Release Process

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

## Quick Start

```bash
# 1. Make your changes to packages
# 2. Add a changeset describing your changes
pnpm changeset

# 3. Commit the changeset file
git add .changeset
git commit -m "docs: add changeset"

# 4. Push to main (release happens automatically via GitHub Actions)
```

## Detailed Workflow

### 1. Adding a Changeset

After making changes to any package, create a changeset:

```bash
pnpm changeset
```

You'll be prompted to:
1. **Select packages**: Choose which packages were affected
2. **Select bump type**: 
   - `patch` (0.0.X) - Bug fixes, minor changes
   - `minor` (0.X.0) - New features, backwards compatible
   - `major` (X.0.0) - Breaking changes
3. **Write summary**: Describe the changes (supports markdown)

Example changeset file (`.changeset/happy-pandas-dance.md`):
```md
---
"@desource/phone-mask": minor
"@desource/phone-mask-vue": minor
"@desource/phone-mask-nuxt": minor
---

Add support for dynamic country list updates and improve performance
```

### 2. Automated Release (via GitHub Actions)

When changesets are merged to `main`:

1. **GitHub Action automatically**:
   - Creates a "Version Packages" PR with:
     - Updated package versions
     - Generated CHANGELOGs
     - Updated workspace dependencies
   - Or publishes packages to npm (if Version PR is merged)

2. **To release**: Simply merge the "Version Packages" PR

### 3. Manual Release (Local)

For manual releases or testing:

```bash
# Update versions and generate CHANGELOGs
pnpm changeset:version

# Review changes, then commit
git add .
git commit -m "chore: version packages"

# Build and publish to npm
pnpm changeset:publish

# Push tags
git push --follow-tags
```

## Package Publishing Configuration

Each package must have proper npm configuration:

```json
{
  "name": "@desource/package-name",
  "version": "0.0.0",
  "private": false,
  "publishConfig": {
    "access": "public"
  }
}
```

## Linked Packages

If packages should always be versioned together, add to `.changeset/config.json`:

```json
{
  "linked": [
    ["@desource/phone-mask-vue", "@desource/phone-mask-nuxt"]
  ]
}
```

## Fixed Packages

If packages should have the same version number:

```json
{
  "fixed": [
    ["@desource/phone-mask", "@desource/phone-mask-vue", "@desource/phone-mask-nuxt"]
  ]
}
```

## Pre-releases

For beta/alpha releases:

```bash
# Enter pre-release mode
pnpm changeset pre enter beta

# Add changesets and version as normal
pnpm changeset
pnpm changeset:version

# Publish pre-release
pnpm changeset:publish

# Exit pre-release mode
pnpm changeset pre exit
```

## NPM Token Setup

For GitHub Actions to publish:

1. Create npm token at https://www.npmjs.com/settings/tokens
2. Add as `NPM_TOKEN` in GitHub repo secrets
3. Ensure you're logged in: `npm login`

## Useful Commands

```bash
# Add a changeset
pnpm changeset

# View changeset status
pnpm changeset status

# Version packages (updates package.json + CHANGELOGs)
pnpm changeset:version

# Publish to npm
pnpm changeset:publish

# Full release (version + publish)
pnpm release
```

## Changeset Types

### Patch (0.0.X)
- Bug fixes
- Documentation updates
- Internal refactoring
- Dependency updates

### Minor (0.X.0)
- New features
- Non-breaking API additions
- Performance improvements

### Major (X.0.0)
- Breaking API changes
- Removal of deprecated features
- Major refactoring affecting public API

## Best Practices

1. **One changeset per PR**: Add changeset in your feature branch
2. **Descriptive summaries**: Write clear, user-facing change descriptions
3. **Multiple packages**: If a change affects multiple packages, select all of them
4. **Breaking changes**: Always mark breaking changes as `major`
5. **Workspace dependencies**: Changesets automatically updates `workspace:*` versions

## Troubleshooting

### Package not publishing
- Check `private: false` in package.json
- Verify npm authentication: `npm whoami`
- Check package scope permissions

### Version conflicts
- Ensure all changesets are consumed before adding new ones
- Run `pnpm changeset:version` to clear pending changesets

### GitHub Action fails
- Verify NPM_TOKEN secret is set
- Check GITHUB_TOKEN has write permissions
- Review workflow logs for specific errors

## Example Workflow

1. **Feature branch**:
   ```bash
   git checkout -b feat/new-feature
   # Make changes to @desource/phone-mask
   pnpm changeset
   # Select: @desource/phone-mask, minor
   # Summary: "Add new formatInternational method"
   git add .
   git commit -m "feat: add formatInternational method"
   git push origin feat/new-feature
   ```

2. **Create PR** → merge to main

3. **GitHub Action**:
   - Creates "Version Packages" PR
   - Updates @desource/phone-mask to 0.1.0
   - Generates CHANGELOG.md
   - Updates dependent packages (@desource/phone-mask-vue, @desource/phone-mask-nuxt)

4. **Merge "Version Packages" PR**:
   - Packages automatically published to npm
   - Git tags created
   - GitHub Release created

## Resources

- [Changesets Documentation](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
