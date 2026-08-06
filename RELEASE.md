# Release Process

This monorepo uses [Changesets](https://github.com/changesets/changesets) to version and publish all
public packages together. Every release has one shared version, one Git tag, and one GitHub release.

## Packages

The following packages form a Changesets fixed group and always receive the same version bump:

- `@desource/phone-mask`
- `@desource/phone-mask-react`
- `@desource/phone-mask-vue`
- `@desource/phone-mask-svelte`
- `@desource/phone-mask-nuxt`

## Standard Release

### 1. Create the release branch

Start from an up-to-date `main` branch and replace `X.Y.Z` with the intended version:

```bash
git switch main
git pull --ff-only
git switch -c chore/release-X.Y.Z
```

### 2. Create the release changeset

```bash
pnpm changeset
```

In the prompts:

1. Select every public package listed above. The fixed group enforces the shared version, but all
   packages must be selected for the summary to appear in every package changelog.
2. Select the same `major`, `minor`, or `patch` bump for the release.
3. Write the complete, user-facing release summary.
4. Confirm the generated changeset.

### 3. Apply the version

```bash
pnpm changeset:version
```

This consumes all pending changesets and updates the five package versions and changelogs. A pnpm
install is not required because internal packages use `workspace:*`; package version changes do not
change the workspace importers in `pnpm-lock.yaml`.

Before committing, verify:

- all five `package.json` files contain the intended version;
- all five changelogs contain the release summary;
- `packages/phone-mask/CHANGELOG.md` has the content wanted for the GitHub release;
- all temporary changeset files were consumed;
- no unrelated files changed.

### 4. Open and merge the release pull request

```bash
git add .
git commit -m "chore: Release packages"
git push -u origin chore/release-X.Y.Z
```

Open a pull request to `main` and squash-merge it. Keep the squash commit message as
`chore: Release packages` so it triggers the release workflow.

### 5. Automated publishing

After the release commit reaches `main`, `.github/workflows/release.yml`:

1. installs dependencies with the frozen lockfile;
2. verifies that every public package has the core package version;
3. extracts the matching entry from `packages/phone-mask/CHANGELOG.md`;
4. builds and publishes all packages to npm without package-specific Git tags;
5. creates one Git tag named `X.Y.Z`;
6. creates one GitHub release named `X.Y.Z` using the extracted changelog entry.

The workflow marks versions such as `2.0.0-beta.0` as GitHub pre-releases.

## Manual Recovery

The workflow can be started from **Actions → Release → Run workflow**, or with GitHub CLI:

```bash
gh workflow run Release
```

Use manual dispatch to recover a release whose automatic workflow was interrupted. npm publishing
and GitHub release creation are safe to retry: already-published package versions are skipped, and
an existing GitHub release is left unchanged.

## Version Types

- **Patch (`1.0.X`)**: bug fixes and compatible internal improvements.
- **Minor (`1.X.0`)**: backward-compatible features and public API additions.
- **Major (`X.0.0`)**: breaking public API changes.

## Useful Commands

```bash
# Create a changeset
pnpm changeset

# Inspect pending changesets and calculated bumps
pnpm changeset status

# Consume changesets and update package versions/changelogs
pnpm changeset:version

# Build and publish unpublished versions without creating Git tags
pnpm changeset:publish
```

`pnpm changeset:publish` is a low-level workflow command: it publishes packages without creating a
Git tag or GitHub release. Use the pull-request workflow for complete releases so the version changes
are reviewed and the shared release artifact is created after publishing.

## Configuration and Credentials

- `.changeset/config.json` defines the fixed package group and public npm access.
- `NPM_TOKEN` must be configured as a GitHub Actions repository secret.
- The workflow's `GITHUB_TOKEN` requires `contents: write` to create the single tag and release.
- Each publishable package must have `private: false` and `publishConfig.access: public`.

If internal dependencies are ever changed from `workspace:*` to explicit ranges such as
`workspace:^1.6.0`, re-evaluate whether `pnpm install --lockfile-only` is needed after
`changeset version` and commit any resulting lockfile update.

## Troubleshooting

### A package is not published

- Confirm the package version is newer than the version on npm.
- Confirm `private` is not `true`.
- Verify `NPM_TOKEN` and npm scope permissions.
- Review the **Build and publish packages to npm** workflow step.

### The GitHub release is not created

- Confirm npm publishing completed successfully.
- Confirm all public package versions match.
- Confirm the core changelog has a `## X.Y.Z` entry with non-empty content.
- Run the workflow manually to retry.

### Package versions do not match

Do not publish. Correct the changeset or package versions and rerun `pnpm changeset:version`. The
workflow intentionally fails before npm publishing when it detects a mismatch.

## Resources

- [Changesets documentation](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)
- [pnpm workspace protocol](https://pnpm.io/workspaces#workspace-protocol-workspace)
- [Semantic Versioning](https://semver.org/)
