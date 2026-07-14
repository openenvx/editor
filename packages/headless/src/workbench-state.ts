import type {
  CommandExecutionResult,
  CommandService,
  EditorInput,
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
import type { SidebarBehavior } from './contributions/view-contribution';
import type { EditorPaneRegistration } from './workbench/editor-pane-host-props';
import type {
  FieldRendererRegistration,
  InspectorPaneRegistration,
} from './workbench/inspector-pane-registration';
import type { StatusBarItemRendererRegistration } from './workbench/status-bar-item-renderer-registration';
import type { WorkbenchLayout } from './workbench/workbench-layout';

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
}

export interface ViewDescriptor {
  id: string;
  containerId: string;
  name: string;
  viewOrder: number;
  viewSelection: 'layer' | 'page';
  viewHover: 'layer' | 'page' | 'none';
  collapsible: boolean;
  initialCollapsed: boolean;
  items: ViewTreeItem[];
  supportsReorder: boolean;
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
  inspectorPanes: InspectorPaneRegistration[];
  fieldRenderers: FieldRendererRegistration[];
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
  getService: <T>(token: ServiceId<T>) => T | undefined;
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
  editorUri?: string;
  editorTitle?: string;
  layout?: Partial<WorkbenchLayout>;
}
