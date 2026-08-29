# Security policy

OpenEnvx includes extension and embed surfaces that may process code or data supplied by other parties. Treat those boundaries as security-sensitive.

## Reporting a vulnerability

Please do not open a public issue for a vulnerability. Report it privately to the repository maintainers through the security contact configured for the GitHub repository. Include:

- the affected package and version or commit;
- a clear description of the impact;
- reproduction steps or a minimal proof of concept;
- any suggested mitigation.

You will receive an acknowledgement when the report has been reviewed. Please allow maintainers reasonable time to investigate and release a fix before public disclosure.

## Safe extension development

- Keep untrusted extension code in the sandbox worker path.
- Validate protocol messages at the host boundary.
- Use explicit command and capability allowlists.
- Never import private shell or renderer internals into an extension.

See [Plugin-boundaries.md](Plugin-boundaries.md) and [the extension architecture docs](docs/architecture/extensions.md) for the trust model.
