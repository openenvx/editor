export { WorkbenchController } from './workbench/workbench-controller';
export { bootstrapWorkbenchServices } from './workbench/bootstrap-workbench-services';
export type { WorkbenchServiceDeps } from './workbench/bootstrap-workbench-services';
export {
  type WorkbenchApi,
  type WorkbenchControllerOptions,
  type WorkbenchState,
  type ViewContainerDescriptor,
  type ViewContent,
  type ViewDescriptor,
  type ViewTreeItem,
  type ViewTreeItemAction,
  type LayerSurfaceItem,
} from './workbench/workbench-state';
export {
  PropertyPathResolver,
  PropertyValueHandle,
  type PropertyHostContext,
} from './properties/property-path-resolver';
export { PropertyPath } from './properties/property-path';
export {
  createPropertyHostContext,
  readLayerDataAtKey,
  SELECTION_LAYER_DATA_PATH_PREFIX,
  writeLayerDataAtKey,
  type PropertyPathContextOptions,
} from './properties/property-path-context';
export {
  createPluginPropertyHostContext,
  decodePluginHandlerCommand,
  encodePluginHandlerCommand,
  PLUGIN_HANDLER_COMMAND_PREFIX,
  PLUGIN_PATH_PREFIX,
  type PluginPropertyHostContextOptions,
} from './properties/plugin-property-host-context';
export { LayerPropertiesPaneFactory } from './properties/layer-properties-pane-factory';

export { WorkbenchContributionPoint } from './workbench-contributions/workbench-contribution-point';
export { WorkbenchContribution } from './workbench-contributions/workbench-contribution';
export { WorkbenchRegistries } from './registries/workbench-registries';
export {
  ViewContainerContribution,
  ViewContribution,
  TreeDataProvider,
  type SidebarBehavior,
  type TreeItem,
  type TreeItemAction,
  type TreeSelectOptions,
  type ViewContainerLocation,
} from './contributions/view-contribution';
export { WORKBENCH_INSPECTOR_CONTAINER_ID } from './workbench/inspector-container';
export { WORKBENCH_VARIABLES_CONTAINER_ID } from './workbench/variables-container';
export { ViewLocationService } from './workbench/view-location-service';
export {
  WorkbenchNavigationServiceId,
  WorkbenchNavigationServiceImpl,
  type WorkbenchNavigationService,
} from './workbench/workbench-navigation-service';
export {
  DialogServiceId,
  type DialogService,
} from './workbench/dialog-service';
export {
  type ActiveDialog,
  type ConfirmDialogOptions,
  type FormDialogExtraAction,
  type FormDialogPayload,
  type FormDialogResult,
  type ShowFormOptions,
} from './workbench/dialog-registrations';
export {
  RichTextInsertServiceId,
  RichTextInsertServiceImpl,
  type RichTextInsertService,
} from './services/rich-text-insert-service';
export {
  TextBlockInsertServiceId,
  type TextBlockInsertService,
} from './services/text-block-insert-service';
export {
  createWorkbenchPluginContext,
  type WorkbenchPluginContext,
} from './workbench/workbench-plugin-context';
export { WorkbenchPlugin } from './workbench/workbench-plugin';

export { CommandPaletteContribution } from './contributions/command-palette-contribution';
export { ContextMenuContribution } from './contributions/context-menu-contribution';
export { PropertyPaneContribution } from './contributions/property-pane-contribution';
export {
  OverlayContribution,
  type OverlayDescriptor,
} from './contributions/overlay-contribution';
export {
  StatusBarContribution,
  type StatusBarDropdownItemDescriptor,
  type StatusBarItemDescriptor,
  type StatusBarTextItemDescriptor,
} from './contributions/status-bar-contribution';
export {
  SidebarHeaderContribution,
  type SidebarHeaderActionDescriptor,
  type SidebarHeaderDescriptor,
  type SidebarHeaderTitleBinding,
} from './contributions/sidebar-header-contribution';
export { ToolbarContribution } from './contributions/toolbar-contribution';
export { TopBarContribution } from './contributions/top-bar-contribution';

export {
  MenuBuilder,
  MenuItemBuilder,
  createMenuBuilder,
  filterMenuByWhen,
  filterMenuByCanExecute,
  isCommandMenuItem,
  isRadioGroupMenuItem,
  mergeMenuContributions,
  type CommandMenuItemDescriptor,
  type MenuItemDescriptor,
  type SeparatorMenuItemDescriptor,
  type SubmenuMenuItemDescriptor,
  type RadioGroupMenuItemDescriptor,
} from './builders/menu-builder';
export {
  CommandPaletteBuilder,
  CommandPaletteItemBuilder,
  buildCommandPalette,
  createCommandPaletteBuilder,
  humanizeCommandId,
  COMMAND_PALETTE_ALL_TAB_ID,
  type CommandPaletteCategoryDescriptor,
  type CommandPaletteContributionBuild,
  type CommandPaletteDescriptor,
  type CommandPaletteItemDescriptor,
  type CommandPaletteOverride,
  type CommandPaletteTabDescriptor,
} from './builders/command-palette-builder';
export {
  DescriptorBuilder,
  type DescriptorItemBase,
  type ShellItemOptions,
} from './builders/descriptor-builder';
export {
  StatusBarBuilder,
  createStatusBarBuilder,
  isStatusBarDropdownItem,
  type StatusBarDropdownOptions,
} from './builders/status-bar-builder';
export {
  SidebarHeaderBuilder,
  createSidebarHeaderBuilder,
  type SidebarHeaderActionOptions,
} from './builders/sidebar-header-builder';
export {
  ToolbarBuilder,
  createToolbarBuilder,
  isToolbarDropdownItem,
  isToolbarTopPlacement,
  TOOLBAR_PLACEMENTS,
  type ToolbarCommandOptions,
  type ToolbarDropdownOptions,
  type ToolbarItemDescriptor,
  type ToolbarCommandItemDescriptor,
  type ToolbarSeparatorItemDescriptor,
  type ToolbarDropdownItemDescriptor,
  type ToolbarPlacement,
} from './builders/toolbar-builder';
export {
  TopBarBuilder,
  createTopBarBuilder,
  isTopBarDropdownItem,
  isTopBarGroupItem,
  TOP_BAR_PLACEMENTS,
  type TopBarCommandOptions,
  type TopBarDropdownOptions,
  type TopBarGroupOptions,
  type TopBarItemDescriptor,
  type TopBarCommandItemDescriptor,
  type TopBarDropdownItemDescriptor,
  type TopBarGroupItemDescriptor,
  type TopBarSeparatorItemDescriptor,
  type TopBarStatusItemDescriptor,
  type TopBarStatusOptions,
  type TopBarTitleItemDescriptor,
  type TopBarTitleOptions,
  type TopBarTitleBinding,
  type TopBarPlacement,
} from './builders/top-bar-builder';
export {
  isShellDropdownCommandMenuItem,
  type ShellDropdownCommandMenuItemDescriptor,
  type ShellDropdownItemBase,
  type ShellDropdownMenuItemDescriptor,
} from './builders/shell-dropdown';

export {
  PropertyBlockNode,
  PropertyInputGroupNode,
  PropertyLayoutNode,
  PropertyBlockBuilder,
  PropertyPaneBuilder,
  PropertyPaneDescriptor,
  PropertyRowNode,
  createPropertyPane,
} from './properties';
export type {
  PropertyInputGroupCell,
  PropertyLayoutVisitor,
  PropertyValuePath,
  PropertyLayoutWhenOptions,
  PropertyLayoutWhenEvaluator,
} from './properties';
export {
  isPropertyLayoutNodeVisible,
  propertyLayoutNodeReactKey,
} from './properties';

export {
  WorkbenchPart,
  DEFAULT_WORKBENCH_LAYOUT,
  type WorkbenchLayout,
} from './workbench/workbench-layout';
export {
  secondaryPanelContainers,
  shouldMountSecondarySidebar,
} from './workbench/secondary-sidebar-layout';
export type {
  WorkbenchLayoutSnapshot,
  WorkbenchLayoutStore,
} from './workbench/workbench-layout-store';
export { WorkbenchLayoutStoreId } from './workbench/workbench-layout-store-id';
export { mergePrimaryContainerOrder } from './workbench/merge-primary-container-order';
export {
  evaluatePropertyLayoutWhen,
  evaluateContextKeyWhenExpression,
} from './evaluate-when-expression';
export type {
  PropertyWhenEvalOptions,
  PropertyWhenEvalMeta,
} from './evaluate-when-expression';
export {
  bindEditorDiagnosticsService,
  editorDiagnosticLog,
  isEditorDiagnosticsEnabled,
  logEditorDiagnosticsEnabledBanner,
  resolveEditorDiagnosticsFromBrowser,
  resetEditorDiagnosticLogsForTests,
  EDITOR_DEBUG_LOCAL_STORAGE_KEY,
} from './diagnostics/editor-diagnostics';
export type { EditorDiagnosticLevel } from './diagnostics/editor-diagnostics';
export { diagnosePropertyFieldDescriptor } from './properties/property-field-diagnostic';
export {
  isBuiltinPropertyFieldKind,
  safeParsePropertyFieldDescriptor,
} from './properties/property-field-schema';
export {
  EditorDiagnosticsServiceImpl,
  type EditorDiagnosticsService,
} from './diagnostics/editor-diagnostics-service';
export { ShellUiServiceId } from './workbench/shell-ui-service-id';
export {
  ShellUiServiceImpl,
  type ShellUiService,
  type WorkbenchLayoutHost,
} from './workbench/shell-ui-service';
export type {
  EditorPaneHostProps,
  EditorPaneRegistration,
} from './workbench/editor-pane-host-props';
export type {
  FieldRendererRegistration,
  ViewPanelRegistration,
} from './workbench/panel-registrations';
export type { StatusBarItemRendererRegistration } from './workbench/status-bar-item-renderer-registration';

export type {
  DocumentVersion,
  VersionAuthor,
  VersionHistoryProvider,
} from './version-history/version-history-types';
export { VersionHistoryProviderId } from './version-history/version-history-service-id';

export { getNestedValue, setNestedValue } from './utils/nested-value';
export { isTypingTarget } from './utils/is-typing-target';

export type { WorkbenchContributionDisposable } from './registries/workbench-registries';
