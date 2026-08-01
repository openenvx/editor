import type { Layer } from '@openenvx/core';
import { applyHtmlWidgetFace, HtmlBlocksPlugin } from '@openenvx/html';
import {
  SandboxExtensionHost,
  type SandboxExtensionHostOptions,
} from '@xmazu/openenvxee-workbench';

export * from '@openenvx/core';
export * from '@openenvx/headless';
export * from '@openenvx/html';

/**
 * Workbench host surface — shell + plugins + chrome helpers only.
 * No ViewPane / PropertyContentRenderer / panel React re-exports.
 */
export {
  BUILT_IN_THEMES,
  ConfirmDialog,
  createLocalStorageWorkbenchLayoutStore,
  DEFAULT_FIELDS_PLUGIN_ID,
  DEFAULT_INSPECTOR_PLUGIN_ID,
  DEFAULT_LOCALE,
  DEFAULT_THEME,
  DEFAULT_WORKBENCH_CHROME_PLUGIN_ID,
  DefaultInspectorContainerPlugin,
  DefaultWorkbenchChromePlugin,
  DefaultWorkbenchFieldsPlugin,
  registerDefaultWorkbenchBundle,
  Select,
  SUPPORTED_LOCALES,
  THEME_LABELS,
  type BuiltInTheme,
  type SupportedLocale,
  WORKBENCH_I18N_NAMESPACE,
  WORKBENCH_TOGGLE_ACTIVITY_BAR_COMMAND_ID,
  WORKBENCH_TOGGLE_PRIMARY_SIDEBAR_COMMAND_ID,
  WORKBENCH_TOGGLE_SECONDARY_SIDEBAR_COMMAND_ID,
  workbenchEnBundle,
  workbenchPlBundle,
  WorkbenchShell,
  type WorkbenchShellProps,
  SandboxExtensionHost,
  mountSandboxExtensions,
  type SandboxExtensionHostOptions,
} from '@xmazu/openenvxee-workbench';

/** Sandbox host wired for HTML widget faces. */
export function createHtmlSandboxExtensionHost(
  options: Omit<SandboxExtensionHostOptions, 'applyWidgetFace'>
): SandboxExtensionHost {
  return new SandboxExtensionHost({
    ...options,
    applyWidgetFace: (layer, tree) => applyHtmlWidgetFace(layer as Layer, tree),
  });
}

/** Default plugins for an HTML block studio host app. */
export const DEFAULT_HTML_STUDIO_PLUGINS = [new HtmlBlocksPlugin()];
