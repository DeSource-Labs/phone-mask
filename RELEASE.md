# Release Process

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

## Quick Start

```bash
# 1. Contributors add changesets in feature PRs
pnpm changeset

# 2. Merge contributor PRs to main (changesets accumulate)

# 3. When you're ready to release, on main:
pnpm changeset:version

# 4. Commit version/changelog updates with the exact trigger message:
git add .
git commit -m "chore: Release packages"

# 5. Push to main (release workflow publishes)
git push origin main
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
'@desource/phone-mask': minor
'@desource/phone-mask-vue': minor
'@desource/phone-mask-nuxt': minor
---

Add support for dynamic country list updates and improve performance
```

### 2. Maintainer Release Trigger (via GitHub Actions)

This repository uses an explicit release trigger.

1. Merge contributor PRs that contain `.changeset/*.md` files.
2. When ready to publish, run:

```bash
pnpm changeset:version
git add .
git commit -m "chore: Release packages"
git push origin main
```

3. The release workflow runs on `main` and publishes when either:
   - commit message contains `chore: Release packages`
   - workflow is started manually (`workflow_dispatch`)

### 3. Manual Release (Workflow Dispatch)

If you already have version/changelog changes on `main` and want to force publishing without the commit-message trigger:

```bash
# from GitHub UI: Actions -> Release -> Run workflow
# or via GitHub CLI:
gh workflow run Release
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
  "linked": [["@desource/phone-mask-vue", "@desource/phone-mask-nuxt"]]
}
```

## Fixed Packages

If packages should have the same version number:

```json
{
  "fixed": [["@desource/phone-mask", "@desource/phone-mask-vue", "@desource/phone-mask-nuxt"]]
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
- Ensure release commit message is exactly `chore: Release packages` (unless using manual dispatch)
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

3. **Maintainer decides to release**:

   ```bash
   git checkout main
   git pull
   pnpm changeset:version
   git add .
   git commit -m "chore: Release packages"
   git push origin main
   ```

4. **GitHub Action publishes packages**:
   - Publishes updated versions to npm
   - Pushes tags created by Changesets

## Resources

- [Changesets Documentation](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
