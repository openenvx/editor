import type { LayerPreviewDescriptor } from '@openenvx/preview';
import type {
  CommandExecutionResult,
  CommandPaletteDescriptor,
  CommandService,
  EditorInput,
  EditorPaneRegistration,
  EventBus,
  FieldRendererRegistration,
  InspectorPaneRegistration,
  Layer,
  MenuItemDescriptor,
  OverlayDescriptor,
  Plugin,
  PropertySectionDescriptor,
  Scene,
  SceneStore,
  Selection,
  ServiceId,
  SidebarBehavior,
  StatusBarItemDescriptor,
  StatusBarItemRendererRegistration,
  ToolbarItemDescriptor,
  WorkbenchLayout,
  EditorService,
} from '@openenvx/core';

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

export interface WorkbenchApi {
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
  getService: <T>(token: ServiceId<T>) => T | undefined;
  undo: () => boolean;
  redo: () => boolean;
  save: (saveFn?: (input: EditorInput) => Promise<void>) => Promise<void>;
  saveAs: (uri: string) => Promise<void>;
  openDocument: (uri: string) => Promise<void>;
  revert: () => void;
  serializeScene: () => Scene;
  loadScene: (scene: Scene) => void;
  getState: () => WorkbenchState;
}

export interface WorkbenchControllerOptions {
  plugins: Plugin[];
  initialScene?: Scene;
  editorUri?: string;
  editorTitle?: string;
  layout?: Partial<WorkbenchLayout>;
}
