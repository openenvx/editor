/** Deny-by-default capability ids for sandboxed plugins/widgets. */
export const SANDBOX_CAPABILITIES = [
  'document:read',
  'document:write',
  'ui:show',
  'storage:client',
  /** Read/write widget `data.values` (+ resize). Bridge methods stay Figma-shaped. */
  'widget:values',
  'widget:render',
] as const;

export type SandboxCapability = (typeof SANDBOX_CAPABILITIES)[number];

export function isSandboxCapability(value: string): value is SandboxCapability {
  return (SANDBOX_CAPABILITIES as readonly string[]).includes(value);
}

/**
 * Figma-shaped grant kind:
 * - `plugin` — off-canvas tool (user-run, clientStorage, primary showUI)
 * - `widget` — on-canvas object (`data.values`, one isolate per extension)
 * See Plugin-boundaries.md “Plugins vs widgets”.
 */
export type SandboxExtensionKind = 'plugin' | 'widget';

/** Session grant for a sandboxed extension. */
export interface SandboxExtensionGrant {
  id: string;
  kind: SandboxExtensionKind;
  /**
   * HTTPS artifact URL (first-party / marketplace). Optional when `source` is
   * provided (pushed from the parent page).
   */
  artifactUrl?: string;
  /** sha256 hex of the JS bundle bytes. Required with `artifactUrl`. */
  contentHash?: string;
  /**
   * Self-contained JS source pushed from the integrator's bundle.
   * When set, the host evals this instead of fetching `artifactUrl`.
   */
  source?: string;
  capabilities: SandboxCapability[];
  allowedCommands: string[];
  title?: string;
  /** Optional default UI document for showUI / widget iframe. */
  uiHtml?: string;
}

export const SANDBOX_BRIDGE_SOURCE = 'openenvx-sandbox-bridge' as const;
export const SANDBOX_UI_SOURCE = 'openenvx-sandbox-ui' as const;
/** Host → sandboxed showUI iframe (opaque origin; targetOrigin '*'). */
export const SANDBOX_HOST_UI_SOURCE = 'openenvx-sandbox-host-ui' as const;

export type SandboxHostMethod =
  | 'getSelection'
  | 'getPageId'
  | 'executeCommand'
  | 'showUI'
  | 'resizeUI'
  | 'closeUI'
  | 'postToUI'
  | 'notify'
  | 'closePlugin'
  | 'getClientStorage'
  | 'setClientStorage'
  | 'getSyncedState'
  | 'setSyncedState'
  | 'resizeWidget';

export interface SandboxBridgeRequest {
  source: typeof SANDBOX_BRIDGE_SOURCE;
  v: 1;
  id: string;
  method: SandboxHostMethod;
  params?: unknown;
}

export interface SandboxBridgeResponse {
  source: typeof SANDBOX_BRIDGE_SOURCE;
  v: 1;
  id: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}

/** Selection snapshot pushed to showUI (requires `document:read` on the grant). */
export interface SandboxUiSelection {
  activePageId: string | null;
  selectedLayerIds: string[];
  primaryLayerId: string | null;
}

/** Iframe → host messages. */
export interface SandboxUiMessage {
  source: typeof SANDBOX_UI_SOURCE;
  v: 1;
  type: 'ui:message' | 'ui:ready' | 'ui:close';
  pluginMessage?: unknown;
}

/** Host → iframe messages (theme/selection push + isolate postMessage). */
export type SandboxHostUiMessage =
  | {
      source: typeof SANDBOX_HOST_UI_SOURCE;
      v: 1;
      type: 'ui:message';
      pluginMessage: unknown;
    }
  | {
      source: typeof SANDBOX_HOST_UI_SOURCE;
      v: 1;
      type: 'ui:context';
      theme: 'light' | 'dark';
      /** Omitted when the grant lacks `document:read`. */
      selection?: SandboxUiSelection;
    };
