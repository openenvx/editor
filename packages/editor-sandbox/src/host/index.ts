export type { SandboxHostSurface } from './sandbox-host-surface';
export { createSandboxHostSurface } from './create-host-surface';

export {
  SandboxExtensionHost,
  mountSandboxExtensions,
  type SandboxExtensionHostOptions,
  type ApplyWidgetFaceFn,
} from './sandbox-extension-host';

export {
  assertJsonSerializable,
  assertMethodAllowed,
  assertUiMessagePolicy,
  freezeGrant,
  hasCapability,
  normalizeCapabilities,
} from './capabilities';

export {
  assertArtifactUrl,
  fetchAndVerifyArtifact,
  MAX_ARTIFACT_BYTES,
  sha256Hex,
} from './fetch-artifact';

export { createSandboxHostBridge } from './host-bridge';

export { SandboxUiFrame, type SandboxUiFrameProps } from './sandbox-ui-frame';

export { postSandboxUiMessage } from './sandbox-ui-protocol';

export {
  assertNotifyPolicy,
  assertConsolePolicy,
  assertRateLimit,
  MAX_CONCURRENT_ISOLATES,
  MAX_CONSOLE_ARGS_JSON_CHARS,
  MAX_NOTIFY_MESSAGE_CHARS,
  MAX_NOTIFY_PER_SECOND,
  MAX_SHOW_UI_HTML_CHARS,
  MAX_UI_MESSAGE_JSON_CHARS,
  SANDBOX_CPU_LIMIT_MS,
  SANDBOX_EVAL_TIMEOUT_MS,
  SANDBOX_MEMORY_LIMIT_BYTES,
  SANDBOX_WORKER_READY_MS,
} from './sandbox-caps';

export {
  validatePluginTree,
  validateRenderTree,
  MAX_PLUGIN_TREE_NODES,
  MAX_PLUGIN_TREE_JSON_CHARS,
  MAX_RENDER_TREE_NODES,
  MAX_RENDER_TREE_JSON_CHARS,
  type PluginTreeValidationResult,
  type RenderTreeValidationResult,
} from '../protocol';

export {
  createExtensionContributions,
  intersectExtensionPermissions,
  type CreateExtensionContributionsResult,
  type CreateExtensionContributionsOptions,
} from './panel-tree/create-extension-contributions';

export {
  createManifestContributions,
  type CreateManifestContributionsResult,
  type CreateManifestContributionsOptions,
} from './panel-tree/create-manifest-contributions';

export { extensionSurfaceStore } from './panel-tree/extension-surface-store';

export {
  extensionBlockStore,
  type ExtensionBlockPaletteEntry,
} from './panel-tree/extension-block-store';

export { mapPluginTreeToPropertyPane } from './panel-tree/map-plugin-tree-to-property-pane';

export {
  mapPluginTreeToMenu,
  contributePluginTreeToMenu,
} from './panel-tree/map-plugin-tree-to-menu';

export {
  mapPluginTreeToToolbar,
  contributePluginTreeToToolbar,
} from './panel-tree/map-plugin-tree-to-toolbar';

export {
  mapPluginTreeToStatusBar,
  contributePluginTreeToStatusBar,
} from './panel-tree/map-plugin-tree-to-status-bar';

export {
  mapPluginTreeToPalette,
  contributePluginTreeToPalette,
} from './panel-tree/map-plugin-tree-to-palette';
