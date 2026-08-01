import {
  applyWidgetFace,
  CanvasBasicsPlugin,
  setOpenEnvxWidgetClickHandler,
  WIDGET_LAYER_TYPE,
} from '@openenvx/canvas';
import { CanvasProPlugin } from '@openenvx/canvas-pro';
import {
  SandboxExtensionHost,
  type SandboxExtensionHostOptions,
} from '@openenvx/workbench';

export * from '@openenvx/core';
export * from '@openenvx/headless';
export * from '@openenvx/canvas';
export * from '@openenvx/canvas-pro';
export * from '@openenvx/agent';

/**
 * Workbench host surface — shell + plugins + chrome helpers only.
 * Do not re-export ViewPane / PropertyContentRenderer / panel React components;
 * hosts declare ViewContribution.buildProperties() and registerViewPanel only
 * for non-form surfaces via plugins.
 */
export {
  BUILT_IN_THEMES,
  ConfirmDialog,
  createLocalStorageWorkbenchLayoutStore,
  createPostMessagePluginPanelTransport,
  type PostMessagePluginPanelTransportOptions,
  DEFAULT_FIELDS_PLUGIN_ID,
  DEFAULT_INSPECTOR_PLUGIN_ID,
  DEFAULT_LOCALE,
  DEFAULT_THEME,
  DEFAULT_WORKBENCH_CHROME_PLUGIN_ID,
  DefaultInspectorContainerPlugin,
  DefaultWorkbenchChromePlugin,
  DefaultWorkbenchFieldsPlugin,
  EmbedPanelHost,
  mountEmbedPanel,
  type EmbedPanelHostOptions,
  type PluginPanelTransport,
  SandboxExtensionHost,
  mountSandboxExtensions,
  type SandboxExtensionHostOptions,
  assertJsonSerializable,
  assertMethodAllowed,
  fetchAndVerifyArtifact,
  createSandboxHostBridge,
  SandboxUiFrame,
  registerDefaultWorkbenchBundle,
  Select,
  SUPPORTED_LOCALES,
  THEME_LABELS,
  type BuiltInTheme,
  type SupportedLocale,
  VERSION_HISTORY_CONTAINER_ID,
  VERSION_HISTORY_PANEL_COMPONENT_ID,
  VERSION_HISTORY_PLUGIN_ID,
  VERSION_HISTORY_VIEW_ID,
  VersionHistoryPlugin,
  type VersionHistoryPluginOptions,
  WORKBENCH_I18N_NAMESPACE,
  WORKBENCH_SIDEBAR_CONTAINER_ID,
  WORKBENCH_TOGGLE_ACTIVITY_BAR_COMMAND_ID,
  WORKBENCH_TOGGLE_PRIMARY_SIDEBAR_COMMAND_ID,
  WORKBENCH_TOGGLE_SECONDARY_SIDEBAR_COMMAND_ID,
  workbenchEnBundle,
  workbenchPlBundle,
  WorkbenchShell,
  type WorkbenchShellProps,
} from '@openenvx/workbench';

/**
 * Studio factory: wires canvas widget click handler + layer type so extension JS
 * stays in a Worker and workbench never imports canvas.
 */
export function createSandboxExtensionHost(
  options: Omit<
    SandboxExtensionHostOptions,
    'bindWidgetClick' | 'widgetLayerType' | 'applyWidgetFace'
  > &
    Partial<
      Pick<
        SandboxExtensionHostOptions,
        'bindWidgetClick' | 'widgetLayerType' | 'applyWidgetFace'
      >
    >
): SandboxExtensionHost {
  return new SandboxExtensionHost({
    widgetLayerType: WIDGET_LAYER_TYPE,
    bindWidgetClick: (handler) => setOpenEnvxWidgetClickHandler(handler),
    applyWidgetFace: (layer, tree) => applyWidgetFace(layer, tree),
    ...options,
  });
}

/**
 * Default plugin set for a full OpenEnvx Studio host app
 * (canvas basics + canvas-pro chrome + agent).
 * Pages/Layers sidebar + dirty status come from WorkbenchShell defaults.
 * Document export is via cloud export-service API (not in-browser driver).
 */
export const DEFAULT_STUDIO_PLUGINS = [
  new CanvasBasicsPlugin(),
  new CanvasProPlugin(),
  // new CanvasTemplatePlugin(),
  // new AgentChatPlugin(),
];
