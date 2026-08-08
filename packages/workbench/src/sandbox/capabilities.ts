import {
  isSandboxCapability,
  type SandboxCapability,
  type SandboxExtensionGrant,
  type SandboxHostMethod,
} from '@xmazu/openenvxee-extensions/protocol';

import {
  assertArtifactUrl,
  MAX_SHOW_UI_HTML_CHARS,
  MAX_SOURCE_CHARS,
  MAX_UI_MESSAGE_JSON_CHARS,
} from './sandbox-caps';

const METHOD_CAPABILITY: Record<SandboxHostMethod, SandboxCapability | null> = {
  getSelection: 'document:read',
  getPageId: 'document:read',
  executeCommand: 'document:write',
  showUI: 'ui:show',
  resizeUI: 'ui:show',
  closeUI: 'ui:show',
  postToUI: 'ui:show',
  // null = allowed without a capability (still rate-limited / session-gated).
  notify: null,
  closePlugin: null,
  console: null,
  getClientStorage: 'storage:client',
  setClientStorage: 'storage:client',
  getSyncedState: 'widget:values',
  setSyncedState: 'widget:values',
  resizeWidget: 'widget:values',
};

/**
 * Figma-shaped kind gates (docs):
 * - showUI iframe is available to plugins AND widgets (optional for widgets;
 *   primary widget UI is the on-canvas object).
 * - clientStorage is plugin-oriented; widgets use `data.values` on the node.
 * - getSyncedState / setSyncedState / resizeWidget require a widget layer.
 */
const PLUGIN_ONLY_METHODS = new Set<SandboxHostMethod>([
  'getClientStorage',
  'setClientStorage',
]);

const WIDGET_ONLY_METHODS = new Set<SandboxHostMethod>([
  'getSyncedState',
  'setSyncedState',
  'resizeWidget',
]);

export function normalizeCapabilities(
  values: readonly string[]
): SandboxCapability[] {
  const out: SandboxCapability[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (!isSandboxCapability(value) || seen.has(value)) {
      continue;
    }
    seen.add(value);
    out.push(value);
  }
  return out;
}

/** Snapshot a grant so host-mutated arrays cannot widen the session. */
export function freezeGrant(
  grant: SandboxExtensionGrant
): SandboxExtensionGrant {
  if (grant.kind !== 'plugin' && grant.kind !== 'widget') {
    throw new Error(`Unknown sandbox grant kind: ${String(grant.kind)}`);
  }
  const hasSource =
    typeof grant.source === 'string' && grant.source.trim().length > 0;
  const hasArtifact =
    typeof grant.artifactUrl === 'string' &&
    grant.artifactUrl.trim().length > 0;

  if (!hasSource && !hasArtifact) {
    throw new Error('Sandbox grant requires source or artifactUrl');
  }
  if (hasSource && grant.source!.length > MAX_SOURCE_CHARS) {
    throw new Error('Sandbox source too large');
  }
  if (hasArtifact) {
    assertArtifactUrl(grant.artifactUrl!);
    const contentHash = (grant.contentHash ?? '').trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(contentHash)) {
      throw new Error('Invalid contentHash');
    }
  }
  if (
    grant.uiHtml !== undefined &&
    grant.uiHtml.length > MAX_SHOW_UI_HTML_CHARS
  ) {
    throw new Error('showUI HTML too large');
  }

  // Pushed widgets get render (+ values) by default when none declared.
  let capabilities = normalizeCapabilities(grant.capabilities);
  if (grant.kind === 'widget' && hasSource && capabilities.length === 0) {
    capabilities = ['widget:render', 'widget:values'];
  }

  const frozen: SandboxExtensionGrant = {
    id: grant.id,
    kind: grant.kind,
    capabilities,
    allowedCommands: [...grant.allowedCommands],
  };
  if (hasSource) {
    frozen.source = grant.source;
  }
  if (hasArtifact) {
    frozen.artifactUrl = grant.artifactUrl;
    frozen.contentHash = (grant.contentHash ?? '').trim().toLowerCase();
  }
  if (grant.title !== undefined) {
    frozen.title = grant.title;
  }
  if (grant.uiHtml !== undefined) {
    frozen.uiHtml = grant.uiHtml;
  }
  Object.freeze(frozen.capabilities);
  Object.freeze(frozen.allowedCommands);
  return Object.freeze(frozen);
}

export function hasCapability(
  grant: Pick<SandboxExtensionGrant, 'capabilities'>,
  capability: SandboxCapability
): boolean {
  return grant.capabilities.includes(capability);
}

export function assertMethodAllowed(input: {
  grant: SandboxExtensionGrant;
  method: SandboxHostMethod;
  permission: 'read' | 'edit';
  commandId?: string;
}): void {
  if (PLUGIN_ONLY_METHODS.has(input.method) && input.grant.kind !== 'plugin') {
    throw new Error(`${input.method} is plugin-only`);
  }
  if (WIDGET_ONLY_METHODS.has(input.method) && input.grant.kind !== 'widget') {
    throw new Error(`${input.method} is widget-only`);
  }

  const required = METHOD_CAPABILITY[input.method];
  if (required === undefined) {
    throw new Error(`Unknown method: ${input.method}`);
  }
  if (required !== null && !hasCapability(input.grant, required)) {
    throw new Error(`Capability denied: ${required}`);
  }

  const requiresEdit =
    input.method === 'executeCommand' ||
    input.method === 'setSyncedState' ||
    input.method === 'resizeWidget' ||
    input.method === 'setClientStorage';
  if (requiresEdit && input.permission !== 'edit') {
    throw new Error('Session is read-only');
  }

  if (input.method === 'executeCommand') {
    const commandId = input.commandId?.trim() ?? '';
    if (!commandId) {
      throw new Error('commandId required');
    }
    if (!input.grant.allowedCommands.includes(commandId)) {
      throw new Error(`Command not allowlisted: ${commandId}`);
    }
  }
}

export function assertJsonSerializable(
  value: unknown,
  label = 'payload'
): void {
  const seen = new Set<unknown>();
  const walk = (node: unknown): void => {
    if (
      node === null ||
      typeof node === 'string' ||
      typeof node === 'number' ||
      typeof node === 'boolean'
    ) {
      return;
    }
    if (
      typeof node === 'bigint' ||
      typeof node === 'function' ||
      typeof node === 'symbol' ||
      node === undefined
    ) {
      throw new TypeError(`${label} is not JSON-serializable`);
    }
    if (typeof node !== 'object') {
      throw new TypeError(`${label} is not JSON-serializable`);
    }
    if (seen.has(node)) {
      throw new Error(`${label} is not JSON-serializable`);
    }
    seen.add(node);
    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }
      return;
    }
    for (const child of Object.values(node as Record<string, unknown>)) {
      walk(child);
    }
  };
  try {
    walk(value);
    JSON.stringify(value);
  } catch {
    throw new Error(`${label} is not JSON-serializable`);
  }
}

/** JSON + size gate for UI→isolate payloads (host trust boundary). */
export function assertUiMessagePolicy(message: unknown): void {
  assertJsonSerializable(message ?? null, 'pluginMessage');
  const encoded = JSON.stringify(message ?? null);
  if (encoded.length > MAX_UI_MESSAGE_JSON_CHARS) {
    throw new Error('UI message too large');
  }
}
