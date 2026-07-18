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
export { InspectorPaneContribution } from './contributions/inspector-pane-contribution';
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
  InspectorPaneBuilder,
  InspectorPaneDescriptor,
  InspectorRowNode,
  createInspectorPane,
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
export { ShellUiServiceId } from './workbench/shell-ui-service-id';
export {
  ShellUiServiceImpl,
  type ShellUiService,
} from './workbench/shell-ui-service';
export type {
  EditorPaneHostProps,
  EditorPaneRegistration,
} from './workbench/editor-pane-host-props';
export type {
  InspectorPaneRegistration,
  FieldRendererRegistration,
  ViewPanelRegistration,
} from './workbench/inspector-pane-registration';
export type { StatusBarItemRendererRegistration } from './workbench/status-bar-item-renderer-registration';

export type {
  DocumentVersion,
  VersionAuthor,
  VersionHistoryProvider,
} from './version-history/version-history-types';
export { VersionHistoryProviderId } from './version-history/version-history-service-id';
