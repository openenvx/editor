import type {
  CommandExecutionResult,
  CommandService,
  EditorInput,
  EditorState,
  EventBus,
  ExternalStore,
  InteractionState,
  Layer,
  Plugin,
  PropertySectionDescriptor,
  Scene,
  SceneStore,
  Selection,
  ServiceId,
  EditorService,
} from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';

import type { CommandPaletteDescriptor } from './builders/command-palette-builder';
import type { MenuItemDescriptor } from './builders/menu-builder';
import type { StatusBarItemDescriptor } from './builders/status-bar-builder';
import type { ToolbarItemDescriptor } from './builders/toolbar-builder';
import type { OverlayDescriptor } from './contributions/overlay-contribution';
import type {
  SidebarBehavior,
  ViewContainerLocation,
} from './contributions/view-contribution';
import type { PropertyLayoutNode } from './properties/property-layout-node';
import type { PropertyValuePath } from './properties/property-value-path';
import type { WorkbenchContributionDisposable } from './registries/workbench-registries';
import type { WorkbenchContribution } from './workbench-contributions/workbench-contribution';
import type { EditorPaneRegistration } from './workbench/editor-pane-host-props';
import type {
  FieldRendererRegistration,
  ViewPanelRegistration,
} from './workbench/panel-registrations';
import type { StatusBarItemRendererRegistration } from './workbench/status-bar-item-renderer-registration';
import type { WorkbenchLayout } from './workbench/workbench-layout';
import type { WorkbenchLayoutStore } from './workbench/workbench-layout-store';

export interface ViewTreeItem {
  id: string;
  label: string;
  icon?: string;
  depth: number;
  hasChildren: boolean;
  source: unknown;
  locked?: boolean;
  lockedCommandId?: string;
  tooltip?: string;
  visible?: boolean;
  visibilityCommandId?: string;
  renameCommandId?: string;
  editLabel?: string;
}

export type ViewContent =
  | { kind: 'tree'; items: ViewTreeItem[] }
  | {
      kind: 'properties';
      nodes: PropertyLayoutNode[];
      headerToggle?: PropertyValuePath;
    }
  | { kind: 'component'; componentId: string }
  | { kind: 'welcome'; message: string };

export interface ViewDescriptor {
  id: string;
  containerId: string;
  name: string;
  viewOrder: number;
  viewSelection: 'layer' | 'page';
  viewHover: 'layer' | 'page' | 'none';
  collapsible: boolean;
  initialCollapsed: boolean;
  supportsReorder: boolean;
  content: ViewContent;
  /** viewsWelcome analogue — used when content is welcome or for empty properties. */
  emptyMessage?: string;
}

export interface ViewContainerDescriptor {
  id: string;
  title: string;
  icon?: string;
  sidebarBehavior: SidebarBehavior;
  sidebarOrder: number;
  sidebarGroup: number;
  commandId?: string;
  menuItems?: MenuItemDescriptor[];
  location: ViewContainerLocation;
  views: ViewDescriptor[];
}

export interface LayerSurfaceItem {
  layer: Layer;
  view: LayerPreviewDescriptor;
}

export interface WorkbenchState {
  revision: number;
  scene: Scene;
  selection: Selection;
  interaction: InteractionState;
  viewContainers: ViewContainerDescriptor[];
  viewLocations: Record<string, ViewContainerLocation>;
  activeContainerByLocation: Record<ViewContainerLocation, string | null>;
  properties: PropertySectionDescriptor[] | null;
  contextMenu: MenuItemDescriptor[];
  commandPalette: CommandPaletteDescriptor;
  overlays: OverlayDescriptor[];
  statusBar: StatusBarItemDescriptor[];
  statusBarItemRenderers: StatusBarItemRendererRegistration[];
  toolbarItems: ToolbarItemDescriptor[];
  commandStates: Record<string, { canExecute: boolean }>;
  layerSurface: LayerSurfaceItem[];
  contextKeys: Record<string, boolean | string | number>;
  editorPaneKind: string;
  editorPanes: EditorPaneRegistration[];
  fieldRenderers: FieldRendererRegistration[];
  viewPanels: ViewPanelRegistration[];
  editor: EditorInput | null;
  layout: WorkbenchLayout;
}

export interface WorkbenchApi extends ExternalStore<WorkbenchState> {
  commands: CommandService;
  scene: SceneStore;
  editor: EditorService;
  events: EventBus;
  executeCommand: (commandId: string, args?: unknown) => Promise<boolean>;
  runCommand: <T = unknown>(
    commandId: string,
    args?: unknown
  ) => Promise<CommandExecutionResult<T>>;
  subscribe: (listener: (state: WorkbenchState) => void) => () => void;
  registerServiceInstance: <T>(id: ServiceId<T>, instance: T) => void;
  updateProperty: (layerId: string, key: string, value: unknown) => void;
  selectViewItem: (viewId: string, item: unknown) => void;
  moveViewItem: (
    viewId: string,
    source: unknown,
    target: unknown,
    position: 'before' | 'after' | 'inside'
  ) => void;
  selectLayers: (layerIds: string[], primaryLayerId?: string | null) => void;
  setHoveredLayer: (layerId: string | null) => void;
  setActiveContainer: (
    location: ViewContainerLocation,
    containerId: string
  ) => void;
  moveContainer: (containerId: string, location: ViewContainerLocation) => void;
  setContainerOrder: (
    location: ViewContainerLocation,
    orderedIds: string[]
  ) => void;
  setActivityBarVisible: (visible: boolean) => void;
  toggleActivityBar: () => void;
  setPrimarySidebarVisible: (visible: boolean) => void;
  togglePrimarySidebar: () => void;
  setSecondarySidebarVisible: (visible: boolean) => void;
  toggleSecondarySidebar: () => void;
  getService: <T>(token: ServiceId<T>) => T | undefined;
  /**
   * Register workbench contributions at runtime (e.g. external panel:manifest).
   * Dispose to remove them and refresh chrome/scene slices.
   */
  registerWorkbenchContributions: (
    ...contributions: WorkbenchContribution[]
  ) => WorkbenchContributionDisposable;
  undo: () => boolean;
  redo: () => boolean;
  save: (saveFn?: (input: EditorInput) => Promise<void>) => Promise<void>;
  saveAs: (uri: string) => Promise<void>;
  openDocument: (uri: string) => Promise<void>;
  revert: () => void;
  serializeScene: () => Scene;
  loadScene: (scene: Scene) => void;
}

export interface WorkbenchControllerOptions {
  plugins: Plugin[];
  initialScene?: Scene;
  initialEditorState?: EditorState;
  editorUri?: string;
  editorTitle?: string;
  layout?: Partial<WorkbenchLayout>;
  layoutStore?: WorkbenchLayoutStore;
  /**
   * When true (default), layer writeMode / showInLayers / templatePolicy are
   * enforced (embed consumer). Dashboard authoring should pass false.
   */
  enforceTemplatePolicy?: boolean;
}
