/**
 * Workbench host surface - shell + chrome helpers only.
 * No ViewPane / PropertyContentRenderer / panel React re-exports.
 * Artboard engines connect via `@openenvx/canvas-driver/studio`, `@openenvx/html-driver/studio`, or `@openenvx/email-driver/studio`.
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
} from '@openenvx/workbench';

export {
  SandboxExtensionHost,
  mountSandboxExtensions,
  type SandboxExtensionHostOptions,
} from '@openenvx/editor-sandbox/host';
