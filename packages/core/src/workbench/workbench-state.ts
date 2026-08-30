import type { CommandPaletteDescriptor } from '../builders/command-palette-builder';
import type { MenuItemDescriptor } from '../builders/menu-builder';
import type { PropertySectionDescriptor } from '../builders/property-builder';
import type { SidebarHeaderDescriptor } from '../builders/sidebar-header-builder';
import type { StatusBarItemDescriptor } from '../builders/status-bar-builder';
import type { ToolbarItemDescriptor } from '../builders/toolbar-builder';
import type { OverlayDescriptor } from '../contributions/overlay-contribution';
import type {
  SidebarBehavior,
  ViewContainerLocation,
  TreeItemAction,
} from '../contributions/view-contribution';
import type { Plugin } from '../core/plugin';
import type { SandboxHostSurface } from '../external-host/sandbox-host-surface';
import type { LayerPreviewDescriptor } from '../preview/layer-preview';
import type { PropertyLayoutNode } from '../properties/property-layout-node';
import type { PropertyValuePath } from '../properties/property-value-path';
import type { WorkbenchContributionDisposable } from '../registries/workbench-registries';
import type { CommandExecutionResult } from '../runtime/command-result';
import type { CommandService } from '../runtime/command-service';
import type { ServiceId } from '../runtime/create-service-id';
import type { ExternalStore } from '../runtime/external-store';
import type { InteractionState } from '../runtime/interaction-state';
import type { EventBus } from '../runtime/workbench-events';
import type { SceneStore } from '../scene/scene-store';
import type { EditorState, Layer, Scene, Selection } from '../scene/types';
import type { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import type { EditorInput, EditorService } from '../workbench/editor-service';
import type {
  ActiveDialog,
  ConfirmDialogOptions,
  DialogRegistration,
} from './dialog-registrations';
import type { EditorPaneRegistration } from './editor-pane-host-props';
import type {
  FieldRendererRegistration,
  ViewPanelRegistration,
} from './panel-registrations';
import type { StatusBarItemRendererRegistration } from './status-bar-item-renderer-registration';
import type { TopBarRegistration } from './top-bar-registration';
import type { WorkbenchLayout } from './workbench-layout';
import type { WorkbenchLayoutStore } from './workbench-layout-store';

export type ViewTreeItemAction = TreeItemAction;

export interface ViewTreeItem {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  commandId?: string;
  actions?: ViewTreeItemAction[];
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
  | { kind: 'list'; items: ViewTreeItem[] }
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
  viewSelection: 'layer' | 'page' | 'none';
  viewHover: 'layer' | 'page' | 'none';
  collapsible: boolean;
  initialCollapsed: boolean;
  supportsReorder: boolean;
  content: ViewContent;
  /** Footer add button command (list presentation). */
  addCommandId?: string;
  /** Footer add button label (list presentation). */
  addLabel?: string;
  /** Optional glyph id for the accordion section header. */
  icon?: string;
  /**
   * Optional labelled group. Consecutive views sharing a group sit under one
   * heading in the shell.
   */
  group?: string;
  /** viewsWelcome analogue - used when content is welcome or for empty properties. */
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
  sheetOpenKey?: string;
  sheetDescription?: string;
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
  /** Custom headers keyed by view container id. */
  sidebarHeaders: Record<string, SidebarHeaderDescriptor>;
  statusBar: StatusBarItemDescriptor[];
  statusBarItemRenderers: StatusBarItemRendererRegistration[];
  toolbarItems: ToolbarItemDescriptor[];
  topBars: TopBarRegistration[];
  commandStates: Record<string, { canExecute: boolean }>;
  layerSurface: LayerSurfaceItem[];
  contextKeys: Record<string, boolean | string | number>;
  editorPaneKind: string;
  editorPanes: EditorPaneRegistration[];
  fieldRenderers: FieldRendererRegistration[];
  viewPanels: ViewPanelRegistration[];
  dialogs: DialogRegistration[];
  activeDialog: ActiveDialog | null;
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
  /** Apply multiple layer data keys in one history step. */
  updateProperties: (layerId: string, updates: Record<string, unknown>) => void;
  selectViewItem: (
    viewId: string,
    item: unknown,
    options?: { additive?: boolean }
  ) => void;
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
   * Register workbench contributions at runtime (e.g. from a validated
   * ExtensionManifest via createExtensionContributions).
   * Dispose to remove them and refresh chrome/scene slices.
   */
  registerWorkbenchContributions: (
    ...contributions: WorkbenchContribution[]
  ) => WorkbenchContributionDisposable;
  /**
   * Mount a sandbox host on a narrow surface (not PluginManager).
   * Returns dispose for the mount.
   */
  mountSandboxHost: (
    activate: (surface: SandboxHostSurface) => void | (() => void)
  ) => () => void;
  undo: () => boolean;
  redo: () => boolean;
  save: (saveFn?: (input: EditorInput) => Promise<void>) => Promise<void>;
  saveAs: (uri: string) => Promise<void>;
  openDocument: (uri: string) => Promise<void>;
  revert: () => void;
  serializeScene: () => Scene;
  loadScene: (scene: Scene) => void;
  openDialog: (id: string, payload?: unknown) => void;
  closeDialog: (id?: string) => void;
  showConfirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  /** Resolves a pending {@link showConfirm} dialog. No-op when none is active. */
  resolveDialogConfirm: (confirmed: boolean) => void;
  /** Global editor diagnostics (console logs for property when, etc.). */
  setEditorDebug: (enabled: boolean) => void;
  isEditorDebug: () => boolean;
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
  /**
   * Initial editor diagnostics when `localStorage.openenvx:debug` is unset.
   * Apps often pass `import.meta.env.DEV`.
   */
  debug?: boolean;
}
