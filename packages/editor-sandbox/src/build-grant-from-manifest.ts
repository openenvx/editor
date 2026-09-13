import type {
  ExtensionManifest,
  SandboxCapability,
  SandboxExtensionGrant,
  SandboxExtensionKind,
} from './protocol';
import { isSandboxCapability } from './protocol';

/** Host session ceilings intersected with the manifest. */
export interface SessionPolicy {
  kind: SandboxExtensionKind;
  /** Max capabilities the session will grant. */
  capabilities: readonly SandboxCapability[];
  /** Max command ids the isolate may execute. */
  allowedCommands: readonly string[];
  title?: string;
  uiHtml?: string;
}

export interface BuildGrantFromManifestOptions {
  manifest: ExtensionManifest;
  session: SessionPolicy;
  /** Optional artifact / pushed source - host fills delivery. */
  artifactUrl?: string;
  contentHash?: string;
  source?: string;
}

/**
 * Derive a {@link SandboxExtensionGrant} from an {@link ExtensionManifest}
 * intersected with session policy. Delivery fields (source/artifact) stay host-owned.
 *
 * `requestedCommands` defaults to `[]` when omitted - never inferred from
 * `contributes.commands` (UI chrome ≠ execute allowlist).
 */
export function buildGrantFromManifest(
  options: BuildGrantFromManifestOptions
): SandboxExtensionGrant {
  const { manifest, session } = options;
  const requested = (manifest.permissions ?? []).filter(isSandboxCapability);
  const capabilities = session.capabilities.filter(
    (cap) => requested.length === 0 || requested.includes(cap)
  );
  const wanted = manifest.requestedCommands ?? [];
  const allowedCommands = session.allowedCommands.filter((id) =>
    wanted.includes(id)
  );

  return {
    id: manifest.id,
    kind: session.kind,
    capabilities: [...capabilities],
    allowedCommands: [...allowedCommands],
    ...(options.artifactUrl ? { artifactUrl: options.artifactUrl } : {}),
    ...(options.contentHash ? { contentHash: options.contentHash } : {}),
    ...(options.source ? { source: options.source } : {}),
    ...((session.title ?? manifest.name)
      ? { title: session.title ?? manifest.name }
      : {}),
    ...(session.uiHtml ? { uiHtml: session.uiHtml } : {}),
  };
}
