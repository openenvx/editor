# Changesets

Add a changeset when a publishable package changes:

```bash
bun run changeset
```

Commit the generated file. On merge to `main`, CI versions, publishes to GitHub Packages, and pushes the version bump.
