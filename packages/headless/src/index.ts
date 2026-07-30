export { WorkbenchController } from './workbench-controller';
export { bootstrapWorkbenchServices } from './bootstrap-workbench-services';
export type { WorkbenchServiceDeps } from './bootstrap-workbench-services';
export {
  type WorkbenchApi,
  type WorkbenchControllerOptions,
  type WorkbenchState,
  type ViewContainerDescriptor,
  type ViewContent,
  type ViewDescriptor,
  type ViewTreeItem,
  type LayerSurfaceItem,
} from './workbench-state';
export {
  InspectorPathResolver,
  InspectorValueHandle,
  type InspectorHostContext,
} from './inspector/inspector-path-resolver';
export { InspectorPath } from './inspector/inspector-path';
export {
  createInspectorHostContext,
  type InspectorPathContextOptions,
} from './inspector/inspector-path-context';
export {
  createPluginInspectorHostContext,
  decodePluginHandlerCommand,
  encodePluginHandlerCommand,
  PLUGIN_HANDLER_COMMAND_PREFIX,
  PLUGIN_PATH_PREFIX,
  type PluginInspectorHostContextOptions,
} from './inspector/plugin-inspector-host-context';
export { LayerPropertiesPaneFactory } from './inspector/layer-properties-pane-factory';

export { WorkbenchContributionPoint } from './workbench-contributions/workbench-contribution-point';
export { WorkbenchContribution } from './workbench-contributions/workbench-contribution';
export { WorkbenchRegistries } from './registries/workbench-registries';
export {
  ViewContainerContribution,
  ViewContribution,
  TreeDataProvider,
  type SidebarBehavior,
  type TreeItem,
  type ViewContainerLocation,
} from './contributions/view-contribution';
export { WORKBENCH_INSPECTOR_CONTAINER_ID } from './workbench/inspector-container';
export { ViewLocationService } from './workbench/view-location-service';
export {
  createWorkbenchPluginContext,
  type WorkbenchPluginContext,
} from './workbench-plugin-context';
export { WorkbenchPlugin } from './workbench-plugin';

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
  ToolbarContribution,
  type ToolbarCommandItemDescriptor,
  type ToolbarDropdownItemDescriptor,
  type ToolbarItemDescriptor,
  type ToolbarSeparatorItemDescriptor,
} from './contributions/toolbar-contribution';

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
  ToolbarBuilder,
  createToolbarBuilder,
  isToolbarDropdownItem,
  type ToolbarCommandOptions,
  type ToolbarDropdownOptions,
} from './builders/toolbar-builder';
export {
  type ShellDropdownItemBase,
  type ShellDropdownMenuItemDescriptor,
} from './builders/shell-dropdown';

export {
  InspectorBlockNode,
  InspectorInputGroupNode,
  InspectorLayoutNode,
  PropertyBlockBuilder,
  PropertyPaneBuilder,
  PropertyPaneDescriptor,
  InspectorRowNode,
  createPropertyPane,
} from './inspector';
export type {
  InspectorInputGroupCell,
  InspectorLayoutVisitor,
  InspectorValuePath,
} from './inspector';

export {
  WorkbenchPart,
  DEFAULT_WORKBENCH_LAYOUT,
  type WorkbenchLayout,
} from './workbench/workbench-layout';
export type {
  WorkbenchLayoutSnapshot,
  WorkbenchLayoutStore,
} from './workbench/workbench-layout-store';
export { WorkbenchLayoutStoreId } from './workbench/workbench-layout-store-id';
export { mergePrimaryContainerOrder } from './workbench/merge-primary-container-order';
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

export { mapPluginTreeToPropertyPane } from './plugin-protocol/map-plugin-tree-to-property-pane';
export {
  mapPluginTreeToMenu,
  contributePluginTreeToMenu,
} from './plugin-protocol/map-plugin-tree-to-menu';
export {
  mapPluginTreeToToolbar,
  contributePluginTreeToToolbar,
} from './plugin-protocol/map-plugin-tree-to-toolbar';
export {
  mapPluginTreeToStatusBar,
  contributePluginTreeToStatusBar,
} from './plugin-protocol/map-plugin-tree-to-status-bar';
export {
  mapPluginTreeToPalette,
  contributePluginTreeToPalette,
} from './plugin-protocol/map-plugin-tree-to-palette';
export {
  createManifestContributions,
  type CreateManifestContributionsResult,
  type CreateManifestContributionsOptions,
} from './plugin-protocol/create-manifest-contributions';
export type { WorkbenchContributionDisposable } from './registries/workbench-registries';
