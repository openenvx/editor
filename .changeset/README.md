# Changesets

Add a changeset when a publishable package changes:

```bash
bun run changeset
```

Commit the generated file. On merge to `main`, CI versions, publishes to [npm](https://www.npmjs.com/org/openenvx), and pushes the version bump.

Keep `workspace:*` in package manifests — Bun resolves those locally and rewrites them to real semver in tarballs via `bun pm pack`. Do not hand-edit internal deps to `"0.1.0"`.

Before a release, verify tarballs resolve deps correctly:

```bash
bun run verify-pack
```

## CI publishing

Release uses **npm trusted publishing (OIDC)** — no `NPM_TOKEN` secret needed.

Each publishable package on npmjs.com needs a trusted publisher configured for this repo with workflow filename **`release.yml`** (exact match, including extension).

`bun publish` does not support OIDC and will prompt for browser login in CI. Release instead runs `bun pm pack` (rewrite `workspace:*`) then `npm publish <tarball>` (OIDC auth).

Requirements:

- `id-token: write` in `.github/workflows/release.yml`
- npm CLI ≥ 11.5.1 (CI installs latest npm)
- GitHub-hosted runners (not self-hosted)
