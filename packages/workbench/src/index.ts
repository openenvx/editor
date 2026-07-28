export { useWorkbench, type UseWorkbenchResult } from './hooks/use-workbench';
export {
  useWorkbenchSelector,
  useWorkbenchContextSelector,
} from './hooks/use-workbench-selector';
export {
  EditorViewportProvider,
  useEditorViewport,
  useEditorViewportBridge,
} from './context/editor-viewport-context';
export {
  ThemeProvider,
  useTheme,
  useSetTheme,
  useThemeScope,
  DEFAULT_THEME,
  BUILT_IN_THEMES,
  THEME_LABELS,
  type BuiltInTheme,
  type ThemeProviderProps,
  type ThemeContextValue,
} from './context/theme-context';
export {
  LocaleProvider,
  useLocale,
  useSetLocale,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type LocaleContextValue,
  type SupportedLocale,
  type LocaleProviderProps,
} from './context/locale-context';
export {
  WorkbenchI18nProvider,
  type WorkbenchI18nProviderProps,
} from './i18n/workbench-i18n-provider';
export { useWorkbenchTranslation } from './i18n/use-workbench-translation';
export {
  registerDefaultWorkbenchBundle,
  WORKBENCH_I18N_NAMESPACE,
} from './i18n/workbench-i18n';
export { default as workbenchEnBundle } from './i18n/locales/en/workbench-en';
export { default as workbenchPlBundle } from './i18n/locales/pl/workbench-pl';
export {
  WorkbenchShell,
  type WorkbenchShellProps,
} from './shell/workbench-shell';
export {
  ViewPanelRenderer,
  TreePanelRenderer,
} from './renderers/view-panel-renderer';
export { EditorPaneRenderer } from './renderers/editor-pane-renderer';
export { ContextMenuRenderer } from './renderers/context-menu-renderer';
export { CommandPaletteRenderer } from './renderers/command-palette-renderer';
export { OverlayRenderer } from './renderers/overlay-renderer';
export { StatusBarRenderer } from './renderers/status-bar-renderer';
export { CanvasChrome } from './layout/canvas-chrome';
export { EditorLayout } from './layout/editor-layout';
export { editorLayoutStyles } from './layout/editor-layout-styles';
export {
  DefaultWorkbenchFieldsPlugin,
  DEFAULT_FIELDS_PLUGIN_ID,
} from './fields/default-fields-plugin';
export {
  DefaultInspectorContainerPlugin,
  DEFAULT_INSPECTOR_PLUGIN_ID,
} from './views/default-inspector-plugin';
export {
  DefaultWorkbenchChromePlugin,
  DEFAULT_WORKBENCH_CHROME_PLUGIN_ID,
} from './views/default-workbench-chrome-plugin';
export {
  LayersTreeProvider,
  PagesTreeProvider,
  WORKBENCH_LAYERS_VIEW_ID,
  WORKBENCH_PAGES_VIEW_ID,
  WORKBENCH_SIDEBAR_CONTAINER_ID,
  WorkbenchLayersView,
  WorkbenchPagesView,
  WorkbenchSidebarContainer,
  WorkbenchStatusBarContribution,
} from './views/workbench-chrome-contributions';
export { SecondarySidebarRenderer } from './renderers/secondary-sidebar-renderer';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './primitives/tabs';
export { NumericControl } from './inputs/basic/numeric-control';
export { TextInput } from './inputs/basic/text-input';
export { WorkbenchIcon } from './icons/workbench-icon';
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroups,
  DropdownMenuTrigger,
} from './primitives/dropdown-menu';
export { InspectorPanel } from './layout/inspector-panel';
export {
  ActivitySidebar,
  type ActivitySidebarProps,
  type SidebarPanelComponent,
} from './layout/activity-sidebar';
export { ConfirmDialog } from './primitives/confirm-dialog';
export { Select } from './primitives/select';
export {
  NumericInput,
  type NumericInputProps,
} from './primitives/numeric-input';
export {
  computeScrubValue,
  type ScrubComputeOptions,
} from './primitives/numeric-scrub';
export {
  ColorPickerPopover,
  type ColorPickerPopoverProps,
} from './primitives/color-picker';
export {
  VersionHistoryPlugin,
  VERSION_HISTORY_CONTAINER_ID,
  VERSION_HISTORY_VIEW_ID,
  VERSION_HISTORY_PANEL_COMPONENT_ID,
  VERSION_HISTORY_PLUGIN_ID,
  type VersionHistoryPluginOptions,
} from './version-history/version-history-plugin';
export { VersionHistoryPanel } from './version-history/version-history-panel';
export {
  RestoreVersionCommand,
  VERSION_HISTORY_RESTORE_COMMAND_ID,
  type RestoreVersionArgs,
} from './version-history/restore-version-command';

export {
  PluginPanelPlugin,
  type PluginPanelPluginOptions,
} from './plugin-panel/plugin-panel-plugin';
export {
  PluginPanel,
  type PluginPanelProps,
} from './plugin-panel/plugin-panel';
export type { PluginPanelTransport } from './plugin-panel/plugin-panel-transport';
export { createPostMessagePluginPanelTransport } from './plugin-panel/create-post-message-plugin-panel-transport';
export type { PostMessagePluginPanelTransportOptions } from './plugin-panel/create-post-message-plugin-panel-transport';
export {
  validatePluginTree,
  MAX_PLUGIN_TREE_NODES,
  MAX_PLUGIN_TREE_JSON_CHARS,
  type PluginTreeValidationResult,
} from '@xmazu/openenvxee-plugin-protocol';
export {
  PluginTreeRenderer,
  type PluginTreeRendererProps,
} from './plugin-panel/plugin-tree-renderer';
