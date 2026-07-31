/** Deny-by-default capability ids for sandboxed plugins/widgets. */
export const SANDBOX_CAPABILITIES = [
  'document:read',
  'document:write',
  'ui:show',
  'storage:client',
  'widget:syncedState',
] as const;

export type SandboxCapability = (typeof SANDBOX_CAPABILITIES)[number];

export function isSandboxCapability(value: string): value is SandboxCapability {
  return (SANDBOX_CAPABILITIES as readonly string[]).includes(value);
}

export type SandboxExtensionKind = 'plugin' | 'widget';

/** Session/mint grant for a first-party sandboxed extension. */
export interface SandboxExtensionGrant {
  id: string;
  kind: SandboxExtensionKind;
  artifactUrl: string;
  /** sha256 hex of the JS bundle bytes. */
  contentHash: string;
  capabilities: SandboxCapability[];
  allowedCommands: string[];
  title?: string;
  /** Optional default UI document for showUI / widget iframe. */
  uiHtml?: string;
}

export const SANDBOX_BRIDGE_SOURCE = 'openenvx-sandbox-bridge' as const;
export const SANDBOX_UI_SOURCE = 'openenvx-sandbox-ui' as const;

export type SandboxHostMethod =
  | 'getSelection'
  | 'getPageId'
  | 'executeCommand'
  | 'showUI'
  | 'resizeUI'
  | 'closeUI'
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

export interface SandboxUiMessage {
  source: typeof SANDBOX_UI_SOURCE;
  v: 1;
  type: 'ui:message' | 'ui:ready' | 'ui:close';
  pluginMessage?: unknown;
}
