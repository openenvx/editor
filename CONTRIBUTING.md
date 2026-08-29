# Contributing to OpenEnvx

Thanks for helping improve OpenEnvx. Contributions are welcome in the form of bug reports, documentation, tests, and pull requests.

## Before you start

1. Search existing [issues](https://github.com/openenvx/openenvx/issues) and pull requests.
2. For larger changes, open an issue first so the design and package boundary can be discussed.
3. Keep changes focused. Do not move functionality between packages without updating the architecture docs.

## Local setup

OpenEnvx uses Bun workspaces and Turborepo.

```bash
bun install
bun run dev:playground
```

The repository requires Node.js 24+ and Bun 1.3+. Published packages are built from their package directories; workspace packages resolve TypeScript source during development.

## Making a change

- Put code in the package that owns the behavior. Start with [Architecture.md](Architecture.md).
- Keep public exports intentional and update [packages-and-api.md](docs/architecture/packages-and-api.md) when they change.
- Add a focused test for non-trivial behavior.
- Update user-facing capability notes in [FEATURES.md](FEATURES.md).
- Use kebab-case filenames and avoid `I`-prefixed interfaces or type aliases.
- Do not add compatibility shims for pre-1.0 APIs. Update callers in the same change.

## Checks

Run the relevant package checks while developing, then run the repository gates before submitting:

```bash
bun run fix
bun run precommit
bun run build
bun run test
```

If a check fails, include the failure and any environmental details in the pull request.

## Pull requests

Pull requests should explain:

- what problem the change solves;
- which package or public surface it affects;
- how it was tested;
- whether documentation or a feature-matrix update is needed.

Keep commits and pull requests small enough to review. Maintainers may ask for a design issue or split a broad change into separate pull requests.

## Security and trust boundaries

Never load untrusted extension JavaScript into the editor main world. Follow [Plugin-boundaries.md](Plugin-boundaries.md) and the sandbox extension guide when working with external code.

For security vulnerabilities, follow [SECURITY.md](SECURITY.md) rather than opening a public issue.
