# Changesets

Add a changeset when a publishable package changes:

```bash
bun run changeset
```

Commit the generated file. On merge to `main`, CI versions, publishes to [npm](https://www.npmjs.com/org/openenvx), and pushes the version bump.

CI requires an `NPM_TOKEN` repository secret set to an npm **Automation** access token (classic) or a granular token with publish access and 2FA bypass for automation. Publish tokens that require OTP will fail in CI with `EOTP`.
