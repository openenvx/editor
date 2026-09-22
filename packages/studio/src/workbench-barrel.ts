export { useWorkbench, type UseWorkbenchResult } from './hooks/use-workbench';
export {
  useWorkbenchSelector,
  useWorkbenchContextSelector,
} from './hooks/use-workbench-selector';
export { useWorkbenchContext } from './context/workbench-context';
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
} from './ui/renderers/view-panel-renderer';
export { EditorPaneRenderer } from './ui/renderers/editor-pane-renderer';
export { ContextMenuRenderer } from './ui/renderers/context-menu-renderer';
export { CommandPaletteRenderer } from './ui/renderers/command-palette-renderer';
export { OverlayRenderer } from './ui/renderers/overlay-renderer';
export { StatusBarRenderer } from './ui/renderers/status-bar-renderer';
export { TopBarRenderer } from './ui/renderers/top-bar-renderer';
export { EditorChrome } from './layout/editor-chrome';
export type {
  EditorChromeProps,
  EditorChromeToolbars,
} from './layout/editor-chrome';
export { ToolbarRenderer } from './ui/renderers/toolbar-renderer';
export { EditorLayout } from './layout/editor-layout';
export { editorLayoutStyles } from './layout/editor-layout-styles';
export {
  DefaultWorkbenchFieldsPlugin,
  DEFAULT_FIELDS_PLUGIN_ID,
} from './ui/fields/default-fields-plugin';
export {
  DefaultInspectorContainerPlugin,
  DEFAULT_INSPECTOR_PLUGIN_ID,
} from './views/default-inspector-plugin';
export {
  DefaultWorkbenchChromePlugin,
  DEFAULT_WORKBENCH_CHROME_PLUGIN_ID,
  WORKBENCH_TOGGLE_ACTIVITY_BAR_COMMAND_ID,
  WORKBENCH_TOGGLE_PRIMARY_SIDEBAR_COMMAND_ID,
  WORKBENCH_TOGGLE_SECONDARY_SIDEBAR_COMMAND_ID,
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
export { SecondarySidebarRenderer } from './ui/renderers/secondary-sidebar-renderer';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/primitives/tabs';
export { NumericControl } from './ui/inputs/basic/numeric-control';
export { TextInput } from './ui/inputs/basic/text-input';
export { WorkbenchIcon } from './ui/icons/workbench-icon';
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroups,
  DropdownMenuTrigger,
} from './ui/primitives/dropdown-menu';
export { createLocalStorageWorkbenchLayoutStore } from './layout/local-storage-workbench-layout-store';
export {
  ActivitySidebar,
  type ActivitySidebarProps,
} from './layout/activity-sidebar';
export { Button } from './ui/primitives/button';
export { createMockWorkbenchApi } from './test/mock-workbench-context';
export { ConfirmDialog } from './ui/primitives/confirm-dialog';
export { Input } from './ui/primitives/input';
export { ModalDialog } from './ui/primitives/modal-dialog';
export { PropertyFieldRow } from './ui/primitives/property-field-row';
export { DialogHost } from './ui/renderers/dialog-host';
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  type SheetSide,
} from './ui/primitives/sheet';
export { Select } from './ui/primitives/select';
export {
  NumericInput,
  type NumericInputProps,
} from './ui/primitives/numeric-input';
export {
  computeScrubValue,
  type ScrubComputeOptions,
} from './ui/primitives/numeric-scrub';
export {
  ColorPickerPopover,
  type ColorPickerPopoverProps,
} from './ui/primitives/color-picker';
export {
  VersionHistoryPlugin,
  VERSION_HISTORY_CONTAINER_ID,
  VERSION_HISTORY_VIEW_ID,
  VERSION_HISTORY_PANEL_COMPONENT_ID,
  VERSION_HISTORY_PLUGIN_ID,
  type VersionHistoryPluginOptions,
} from './plugins/version-history/version-history-plugin';
export { VersionHistoryPanel } from './plugins/version-history/version-history-panel';
export {
  RestoreVersionCommand,
  VERSION_HISTORY_RESTORE_COMMAND_ID,
  type RestoreVersionArgs,
} from './plugins/version-history/restore-version-command';
