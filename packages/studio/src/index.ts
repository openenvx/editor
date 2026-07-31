import { AgentChatPlugin } from '@openenvx/agent';
import {
  CanvasBasicsPlugin,
  setOpenEnvxWidgetClickHandler,
  WIDGET_LAYER_TYPE,
} from '@openenvx/canvas';
import { DriverImagePlugin } from '@openenvx/driver-image';
import {
  CanvasProPlugin,
  CanvasTemplatePlugin,
} from '@xmazu/openenvxee-canvas-pro';
import {
  SandboxExtensionHost,
  type SandboxExtensionHostOptions,
} from '@xmazu/openenvxee-workbench';

export * from '@openenvx/core';
export * from '@openenvx/headless';
export * from '@openenvx/canvas';
export * from '@xmazu/openenvxee-canvas-pro';
export * from '@openenvx/agent';
export * from '@openenvx/driver-image';

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
  WORKBENCH_TOGGLE_ACTIVITY_BAR_COMMAND_ID,
  WORKBENCH_TOGGLE_PRIMARY_SIDEBAR_COMMAND_ID,
  WORKBENCH_TOGGLE_SECONDARY_SIDEBAR_COMMAND_ID,
  workbenchEnBundle,
  workbenchPlBundle,
  WorkbenchShell,
  type WorkbenchShellProps,
} from '@xmazu/openenvxee-workbench';

/**
 * Studio factory: wires canvas widget click handler + layer type so extension JS
 * stays in a Worker and workbench never imports canvas.
 */
export function createSandboxExtensionHost(
  options: Omit<
    SandboxExtensionHostOptions,
    'bindWidgetClick' | 'widgetLayerType'
  > &
    Partial<
      Pick<SandboxExtensionHostOptions, 'bindWidgetClick' | 'widgetLayerType'>
    >
): SandboxExtensionHost {
  return new SandboxExtensionHost({
    widgetLayerType: WIDGET_LAYER_TYPE,
    bindWidgetClick: (handler) => setOpenEnvxWidgetClickHandler(handler),
    ...options,
  });
}

/**
 * Default plugin set for a full OpenEnvx Studio host app
 * (canvas basics + image driver + canvas-pro chrome + agent).
 * Pages/Layers sidebar + dirty status come from WorkbenchShell defaults.
 */
export const DEFAULT_STUDIO_PLUGINS = [
  new CanvasBasicsPlugin(),
  new DriverImagePlugin(),
  new CanvasProPlugin(),
  new CanvasTemplatePlugin(),
  new AgentChatPlugin(),
];
