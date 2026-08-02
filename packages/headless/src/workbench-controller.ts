import {
  canEditLayerData,
  canSelectLayer,
  EditorRuntime,
  EditorService,
  findLayerById,
  IconRegistryId,
  PluginManager,
  Registry,
  SceneStore,
  setTemplatePolicyEnforced,
  updateLayerInTree,
  walkLayers,
  WorkbenchEvents,
  type CommandExecutionResult,
  type EditorInput,
  type Layer,
  type Plugin,
  type Scene,
  type ServiceId,
} from '@openenvx/core';
import {
  createEmptySceneSnapshot,
  normalizeSceneSnapshot,
} from '@openenvx/schema';

import { bootstrapWorkbenchServices } from './bootstrap-workbench-services';
import type { ViewContainerLocation } from './contributions/view-contribution';
import { ExternalHostMount } from './external-host/external-host-mount';
import { ViewProviderRegistryImpl } from './registries/view-provider-registry';
import type { WorkbenchProviderRegistries } from './registries/workbench-provider-registries';
import {
  registerWorkbenchContribution,
  type WorkbenchContributionDisposable,
  WorkbenchRegistries,
} from './registries/workbench-registries';
import { buildChromeSlice } from './state/chrome-slice-builder';
import { buildCommandsSlice } from './state/commands-slice-builder';
import { EditorSliceBuilder } from './state/editor-slice-builder';
import { InteractionStateStore } from './state/interaction-state-store';
import {
  buildSceneSlice,
  buildSelectionDerivedPatch,
} from './state/scene-slice-builder';
import type { WorkbenchSliceContext } from './state/workbench-slice-context';
import { setNestedValue } from './utils/nested-value';
import type { WorkbenchContribution } from './workbench-contributions/workbench-contribution';
import {
  loadScene as loadSceneDocument,
  openDocument,
  revertDocument,
  saveDocument,
  saveDocumentAs,
} from './workbench-document-ops';
import { attachWorkbenchKeybindings } from './workbench-keybindings';
import { createWorkbenchPluginContext } from './workbench-plugin-context';
import type {
  WorkbenchApi,
  WorkbenchControllerOptions,
  WorkbenchState,
} from './workbench-state';
import { WorkbenchStateCache } from './workbench-state-cache';
import type {
  ChromeSlice,
  CommandsSlice,
  EditorSlice,
  InteractionSlice,
  SceneSlice,
} from './workbench-state-cache';
import { ShellUiServiceId } from './workbench/shell-ui-service-id';
import { ViewLocationService } from './workbench/view-location-service';
import { DEFAULT_WORKBENCH_LAYOUT } from './workbench/workbench-layout';
import type { WorkbenchLayoutSnapshot } from './workbench/workbench-layout-store';
import { WorkbenchLayoutStoreId } from './workbench/workbench-layout-store-id';

type Listener = (state: WorkbenchState) => void;

export class WorkbenchController {
  private readonly runtime: EditorRuntime;
  private readonly manager: PluginManager;
  private readonly layout: WorkbenchSliceContext['layout'];
  private readonly listeners = new Set<Listener>();
  private readonly eventDisposables: (() => void)[] = [];
  private readonly stateCache = new WorkbenchStateCache();
  private readonly editorSliceBuilder = new EditorSliceBuilder();
  private readonly interactionState = new InteractionStateStore();
  private readonly locationService = new ViewLocationService();
  private revision = 0;
  private disposed = false;
  private detachKeybindings: (() => void) | null = null;
  private lastSeenContentRevision = -1;
  private cachedState: WorkbenchState | null = null;
  private readonly workbenchRegistries = new WorkbenchRegistries();
  private readonly providerRegistries: WorkbenchProviderRegistries = {
    editorPaneRegistry: new Registry<string, unknown>('overwrite'),
    fieldRendererRegistry: new Registry<string, unknown>('overwrite'),
    statusBarItemRendererRegistry: new Registry<string, unknown>('overwrite'),
    viewPanelRegistry: new Registry<string, unknown>('overwrite'),
    viewProviderRegistry: new ViewProviderRegistryImpl(),
  };
  private readonly pluginDisposables = new Map<
    string,
    WorkbenchContributionDisposable[]
  >();
  /** External hosts (sandbox / embed) — separate from PluginManager. */
  private readonly externalHosts: ExternalHostMount;
  private applyingLayoutSnapshot = false;

  constructor(private readonly options: WorkbenchControllerOptions) {
    this.layout = { ...DEFAULT_WORKBENCH_LAYOUT, ...options.layout };
    setTemplatePolicyEnforced(options.enforceTemplatePolicy !== false);
    const snapshot = options.initialScene
      ? normalizeSceneSnapshot({
          scene: options.initialScene,
          ...(options.initialEditorState
            ? { editorState: options.initialEditorState }
            : {}),
        })
      : createEmptySceneSnapshot();
    this.runtime = new EditorRuntime(
      new SceneStore(snapshot.scene, snapshot.editorState),
      new EditorService()
    );
    this.manager = new PluginManager(this.runtime);
    this.registerCoreServices();
    this.externalHosts = new ExternalHostMount({
      getSceneStore: () => this.runtime.getScene(),
      getEvents: () => this.runtime.getEvents(),
      runCommand: async (commandId, args) => {
        const result = await this.runCommand(commandId, args);
        return { executed: result.executed };
      },
      registerCommand: (command) => {
        this.manager.getRegistries().commands.register(command);
      },
      unregisterCommand: (commandId) => {
        this.manager.getRegistries().commands.unregister(commandId);
      },
      onCommandsChanged: () => {
        this.stateCache.invalidateCommands();
        this.notify();
      },
      registerWorkbenchContributions: (...contributions) =>
        this.registerWorkbenchContributions(...contributions),
      viewPanelRegistry: this.providerRegistries.viewPanelRegistry,
      iconRegistry: this.runtime.services.get(IconRegistryId),
      onContributionsChanged: () => this.invalidateContributions(),
    });
    this.syncLayoutContextKeys();
    this.wireStateRefresh();
  }

  private get sliceContext(): WorkbenchSliceContext {
    return {
      coreRegistries: this.manager.getRegistries(),
      layout: this.layout,
      locationService: this.locationService,
      providerRegistries: this.providerRegistries,
      runtime: this.runtime,
      workbenchRegistries: this.workbenchRegistries,
    };
  }

  private get documentOpsDeps() {
    return {
      editorService: this.runtime.getEditor(),
      getService: <T>(token: ServiceId<T>) => this.getService(token),
      sceneStore: this.runtime.getScene(),
    };
  }

  private syncLayoutContextKeys(): void {
    const keys = this.runtime.getContextKeys();
    keys.setContext('workbench.floatingToolbar', this.layout.floatingToolbar);
    keys.setContext('workbench.statusBar', this.layout.statusBar);
    keys.setContext('workbench.activityBar', this.layout.activityBar);
    keys.setContext('workbench.primarySidebar', this.layout.primarySidebar);
    keys.setContext('workbench.secondarySidebar', this.layout.secondarySidebar);
    keys.setContext('workbench.editorArea', this.layout.editorArea);
    keys.setContext(
      'template.policyEnforced',
      this.options.enforceTemplatePolicy !== false
    );
  }

  private registerCoreServices(): void {
    bootstrapWorkbenchServices(this.runtime, this.manager.getRegistries(), {
      openDocument: (uri) => this.openDocument(uri),
      save: () => this.save(),
      saveAs: (uri) => this.saveAs(uri),
    });
    this.getService(ShellUiServiceId)?.bindLayoutHost({
      setActivityBarVisible: (visible) => this.setActivityBarVisible(visible),
      toggleActivityBar: () => this.toggleActivityBar(),
      setPrimarySidebarVisible: (visible) =>
        this.setPrimarySidebarVisible(visible),
      togglePrimarySidebar: () => this.togglePrimarySidebar(),
      setSecondarySidebarVisible: (visible) =>
        this.setSecondarySidebarVisible(visible),
      toggleSecondarySidebar: () => this.toggleSecondarySidebar(),
    });
  }

  private wireStateRefresh(): void {
    const events = this.runtime.getEvents();
    this.eventDisposables.push(
      events.on(WorkbenchEvents.DidChangeScene, (snapshot) => {
        const prevContentRevision = this.lastSeenContentRevision;
        this.lastSeenContentRevision = snapshot.contentRevision;
        this.stateCache.onSceneContentRevision(snapshot.contentRevision);
        if (snapshot.contentRevision !== prevContentRevision) {
          this.stateCache.invalidateSceneContent();
        } else {
          this.stateCache.invalidateSelectionOnly(
            snapshot.scene,
            snapshot.editorState,
            snapshot.contentRevision,
            (current) =>
              buildSelectionDerivedPatch(
                this.sliceContext,
                current.viewContainers
              )
          );
        }
        this.notify();
      }),
      events.on(WorkbenchEvents.DidChangeActiveEditor, () => {
        this.stateCache.invalidateEditor();
        this.notify();
      }),
      events.on(WorkbenchEvents.DidChangeDirty, () => {
        this.stateCache.invalidateCommands();
        this.notify();
      }),
      events.on(WorkbenchEvents.DidChangeContext, () => {
        this.stateCache.invalidateChrome();
        this.notify();
      }),
      events.on(WorkbenchEvents.DidExecuteCommand, () => {
        this.stateCache.invalidateChrome();
        this.notify();
      }),
      events.on(WorkbenchEvents.DidChangeLocale, () => {
        this.stateCache.invalidateAll();
        this.notify();
      }),
      this.interactionState.onDidChange((state) => {
        this.stateCache.invalidateInteraction();
        this.runtime
          .getEvents()
          .emit(WorkbenchEvents.DidChangeInteraction, state);
        this.notify();
      }).dispose
    );
  }

  get api(): WorkbenchApi {
    return {
      commands: this.manager.getRegistries().commands,
      editor: this.runtime.getEditor(),
      events: this.runtime.getEvents(),
      executeCommand: (id, args) => this.executeCommand(id, args),
      runCommand: (id, args) => this.runCommand(id, args),
      subscribe: (listener) => this.subscribe(listener),
      registerServiceInstance: (id, instance) =>
        this.registerServiceInstance(id, instance),
      getService: (token) => this.getService(token),
      registerWorkbenchContributions: (...contributions) =>
        this.registerWorkbenchContributions(...contributions),
      mountSandboxHost: (activate) => this.externalHosts.mountSandbox(activate),
      mountEmbedPanelHost: (activate) =>
        this.externalHosts.mountEmbedPanel(activate),
      getSnapshot: () => this.getState(),
      loadScene: (scene) => this.loadScene(scene),
      moveViewItem: (viewId, source, target, position) =>
        this.moveViewItem(viewId, source, target, position),
      redo: () => this.redo(),
      revert: () => this.revert(),
      save: (saveFn) => this.save(saveFn),
      saveAs: (uri) => this.saveAs(uri),
      openDocument: (uri) => this.openDocument(uri),
      scene: this.runtime.getScene(),
      selectLayers: (layerIds, primaryLayerId) =>
        this.selectLayers(layerIds, primaryLayerId),
      setHoveredLayer: (layerId) => this.setHoveredLayer(layerId),
      setActiveContainer: (location, containerId) =>
        this.setActiveContainer(location, containerId),
      moveContainer: (containerId, location) =>
        this.moveContainer(containerId, location),
      setContainerOrder: (location, orderedIds) =>
        this.setContainerOrder(location, orderedIds),
      setActivityBarVisible: (visible) => this.setActivityBarVisible(visible),
      toggleActivityBar: () => this.toggleActivityBar(),
      setPrimarySidebarVisible: (visible) =>
        this.setPrimarySidebarVisible(visible),
      togglePrimarySidebar: () => this.togglePrimarySidebar(),
      setSecondarySidebarVisible: (visible) =>
        this.setSecondarySidebarVisible(visible),
      toggleSecondarySidebar: () => this.toggleSecondarySidebar(),
      selectViewItem: (viewId, item, options) =>
        this.selectViewItem(viewId, item, options),
      serializeScene: () => this.serializeScene(),
      undo: () => this.undo(),
      updateProperty: (layerId, key, value) =>
        this.updateProperty(layerId, key, value),
      updateProperties: (layerId, updates) =>
        this.updateProperties(layerId, updates),
    };
  }

  async start(): Promise<void> {
    await this.manager.activateCorePlugins();
    // Defer notify until all plugins are active so service overrides (e.g. cloud
    // AssetService) win before any singleton is constructed via canExecute.
    for (const plugin of this.options.plugins) {
      await this.activatePlugin(plugin, { silent: true });
    }
    const sceneStore = this.runtime.getScene();
    // Lookup is already live via PluginManager; re-apply after plugins register rules.
    sceneStore.renormalize();
    this.stateCache.reset();
    this.lastSeenContentRevision = sceneStore.getContentRevision();
    this.stateCache.onSceneContentRevision(this.lastSeenContentRevision);
    this.runtime.getEditor().open(
      {
        isDirty: false,
        scene: sceneStore.getScene(),
        title: this.options.editorTitle ?? 'Untitled',
        uri: this.options.editorUri ?? 'untitled://scene',
      },
      sceneStore.getContentRevision(),
      sceneStore.getEditorState()
    );
    this.detachKeybindings = attachWorkbenchKeybindings(
      this.manager.getRegistries(),
      this.runtime
    );
    await this.restoreLayoutSnapshot();
    this.notify();
  }

  /**
   * Activate a workbench plugin after boot. Contributions are tracked and
   * removed on {@link deactivatePlugin}.
   */
  async activatePlugin(
    plugin: Plugin,
    options?: { silent?: boolean }
  ): Promise<void> {
    if (this.pluginDisposables.has(plugin.id)) {
      await this.deactivatePlugin(plugin.id);
    }
    const disposables: WorkbenchContributionDisposable[] = [];
    const silent = options?.silent === true;
    const ctx = createWorkbenchPluginContext(
      this.manager.createPluginContext(),
      this.workbenchRegistries,
      this.providerRegistries,
      {
        onContributionsChanged: () => {
          if (!silent) {
            this.invalidateContributions();
          }
        },
        trackDisposable: (disposable) => {
          disposables.push(disposable);
        },
      }
    );
    await this.manager.activateWithContext(plugin, ctx);
    this.pluginDisposables.set(plugin.id, disposables);
    if (!silent) {
      this.invalidateContributions();
    }
  }

  /** Deactivate a plugin and dispose its workbench + provider registrations. */
  async deactivatePlugin(pluginId: string): Promise<void> {
    await this.manager.deactivate(pluginId);
    const disposables = this.pluginDisposables.get(pluginId) ?? [];
    for (const disposable of disposables) {
      disposable.dispose();
    }
    this.pluginDisposables.delete(pluginId);
    this.invalidateContributions();
  }

  /** Rebuild chrome + scene slices after contributions change. */
  invalidateContributions(): void {
    this.stateCache.invalidateChrome();
    this.stateCache.invalidateSceneContent();
    this.notify();
  }

  async executeCommand(commandId: string, args?: unknown): Promise<boolean> {
    const { executed } = await this.runCommand(commandId, args);
    return executed;
  }

  async runCommand<T = unknown>(
    commandId: string,
    args?: unknown
  ): Promise<CommandExecutionResult<T>> {
    const ctx = this.runtime.createCommandContext();
    return this.manager
      .getRegistries()
      .commands.execute(
        commandId,
        ctx,
        this.runtime.getEvents(),
        args
      ) as Promise<CommandExecutionResult<T>>;
  }

  getState(): WorkbenchState {
    this.cachedState ??= this.buildState();
    return this.cachedState;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getService<T>(token: ServiceId<T>): T | undefined {
    const services = this.runtime.services;
    if (!services.has(token)) {
      return undefined;
    }
    return services.get(token);
  }

  registerServiceInstance<T>(id: ServiceId<T>, instance: T): void {
    this.runtime.services.registerInstance(id, instance);
    this.stateCache.invalidateChrome();
    this.notify();
  }

  registerWorkbenchContributions(
    ...contributions: WorkbenchContribution[]
  ): WorkbenchContributionDisposable {
    const disposables = contributions.map((contribution) =>
      registerWorkbenchContribution(this.workbenchRegistries, contribution)
    );
    this.invalidateContributions();
    return {
      dispose: () => {
        for (const disposable of disposables) {
          disposable.dispose();
        }
        this.invalidateContributions();
      },
    };
  }

  selectLayers(layerIds: string[], primaryLayerId?: string | null): void {
    const sceneStore = this.runtime.getScene();
    const currentScene = sceneStore.getScene();
    const editableIds = layerIds.filter((id) => {
      const targetLayer = findLayerById(currentScene, id);
      return targetLayer && canSelectLayer(targetLayer);
    });
    if (editableIds.length === 0) {
      sceneStore.selectLayers([], null);
      return;
    }
    const validPrimary =
      primaryLayerId && editableIds.includes(primaryLayerId)
        ? primaryLayerId
        : editableIds[0];
    sceneStore.selectLayers(editableIds, validPrimary ?? null);
  }

  setHoveredLayer(layerId: string | null): void {
    this.interactionState.setHoveredLayer(layerId);
  }

  setActiveContainer(
    location: ViewContainerLocation,
    containerId: string
  ): void {
    this.locationService.setActiveContainer(location, containerId);
    this.notify();
  }

  moveContainer(containerId: string, location: ViewContainerLocation): void {
    this.locationService.moveContainer(containerId, location);
    this.locationService.setActiveContainer(location, containerId);
    if (location === 'primary' && !this.layout.primarySidebar) {
      this.layout.primarySidebar = true;
      this.syncLayoutContextKeys();
      this.stateCache.invalidateChrome();
    }
    if (location === 'secondary' && !this.layout.secondarySidebar) {
      this.layout.secondarySidebar = true;
      this.syncLayoutContextKeys();
      this.stateCache.invalidateChrome();
    }
    this.stateCache.invalidateSceneContent();
    this.notify();
    this.persistLayoutSnapshot();
  }

  setContainerOrder(
    location: ViewContainerLocation,
    orderedIds: string[]
  ): void {
    this.locationService.setContainerOrder(location, orderedIds);
    this.stateCache.invalidateSceneContent();
    this.notify();
    this.persistLayoutSnapshot();
  }

  setActivityBarVisible(visible: boolean): void {
    if (this.layout.activityBar === visible) {
      return;
    }
    this.layout.activityBar = visible;
    this.syncLayoutContextKeys();
    this.stateCache.invalidateChrome();
    this.notify();
    this.persistLayoutSnapshot();
  }

  toggleActivityBar(): void {
    this.setActivityBarVisible(!this.layout.activityBar);
  }

  setPrimarySidebarVisible(visible: boolean): void {
    if (this.layout.primarySidebar === visible) {
      return;
    }
    this.layout.primarySidebar = visible;
    this.syncLayoutContextKeys();
    this.stateCache.invalidateChrome();
    this.notify();
    this.persistLayoutSnapshot();
  }

  togglePrimarySidebar(): void {
    this.setPrimarySidebarVisible(!this.layout.primarySidebar);
  }

  setSecondarySidebarVisible(visible: boolean): void {
    if (this.layout.secondarySidebar === visible) {
      return;
    }
    this.layout.secondarySidebar = visible;
    this.syncLayoutContextKeys();
    this.stateCache.invalidateChrome();
    this.notify();
    this.persistLayoutSnapshot();
  }

  toggleSecondarySidebar(): void {
    this.setSecondarySidebarVisible(!this.layout.secondarySidebar);
  }

  private getLayoutStore() {
    return (
      this.options.layoutStore ??
      this.getService(WorkbenchLayoutStoreId) ??
      null
    );
  }

  private buildLayoutSnapshot(): WorkbenchLayoutSnapshot {
    const primary = this.locationService.getActiveContainer('primary');
    const secondary = this.locationService.getActiveContainer('secondary');
    return {
      locations: { ...this.locationService.getViewLocations() },
      orders: this.locationService.getOrders(),
      visibility: {
        activityBar: this.layout.activityBar,
        primarySidebar: this.layout.primarySidebar,
        secondarySidebar: this.layout.secondarySidebar,
      },
      activeByLocation: {
        ...(primary ? { primary } : {}),
        ...(secondary ? { secondary } : {}),
      },
    };
  }

  private applyLayoutSnapshot(snapshot: WorkbenchLayoutSnapshot): void {
    this.applyingLayoutSnapshot = true;
    try {
      this.applyLayoutSnapshotInner(snapshot);
    } finally {
      this.applyingLayoutSnapshot = false;
    }
  }

  private applyLayoutSnapshotInner(snapshot: WorkbenchLayoutSnapshot): void {
    const { visibility, locations, orders } = snapshot;
    if (visibility.activityBar !== undefined) {
      this.layout.activityBar = visibility.activityBar;
    }
    if (visibility.primarySidebar !== undefined) {
      this.layout.primarySidebar = visibility.primarySidebar;
    }
    if (visibility.secondarySidebar !== undefined) {
      this.layout.secondarySidebar = visibility.secondarySidebar;
    }
    for (const [containerId, location] of Object.entries(locations)) {
      if (location === 'primary' || location === 'secondary') {
        this.moveContainer(containerId, location);
      }
    }
    if (orders) {
      for (const location of ['primary', 'secondary'] as const) {
        const orderedIds = orders[location];
        if (orderedIds) {
          this.locationService.setContainerOrder(location, orderedIds);
        }
      }
    }
    const { activeByLocation } = snapshot;
    if (activeByLocation) {
      for (const location of ['primary', 'secondary'] as const) {
        const containerId = activeByLocation[location];
        if (
          containerId &&
          this.locationService.hasContainer(containerId) &&
          this.locationService.getLocation(containerId) === location
        ) {
          this.locationService.setActiveContainer(location, containerId);
        }
      }
    }
    this.syncLayoutContextKeys();
    this.stateCache.invalidateChrome();
    this.stateCache.invalidateSceneContent();
  }

  private async restoreLayoutSnapshot(): Promise<void> {
    const store = this.getLayoutStore();
    if (!store) {
      return;
    }
    const snapshot = await store.load();
    if (!snapshot) {
      return;
    }
    this.applyLayoutSnapshot(snapshot);
  }

  private persistLayoutSnapshot(): void {
    if (this.applyingLayoutSnapshot) {
      return;
    }
    const store = this.getLayoutStore();
    if (!store) {
      return;
    }
    void store.save(this.buildLayoutSnapshot());
  }

  updateProperty(layerId: string, key: string, value: unknown): void {
    this.updateProperties(layerId, { [key]: value });
  }

  updateProperties(layerId: string, updates: Record<string, unknown>): void {
    const entries = Object.entries(updates);
    if (entries.length === 0) {
      return;
    }

    const sceneStore = this.runtime.getScene();
    const currentScene = sceneStore.getScene();
    const targetLayer = findLayerById(currentScene, layerId);
    if (!targetLayer) {
      return;
    }

    const allowed = entries.filter(([key]) =>
      canEditLayerData(targetLayer, key)
    );
    if (allowed.length === 0) {
      return;
    }

    const bindKey =
      typeof (targetLayer.data as { bind?: unknown } | undefined)?.bind ===
      'string'
        ? ((targetLayer.data as { bind: string }).bind as string)
        : null;
    const bindEntry = allowed.find(
      ([key]) => key === 'html' || key === 'text' || key === 'markup'
    );
    const widgetAncestor =
      bindKey && bindEntry ? findWidgetAncestor(currentScene, layerId) : null;

    const plain =
      widgetAncestor && bindKey && bindEntry
        ? typeof bindEntry[1] === 'string'
          ? htmlToPlainText(bindEntry[1])
          : bindEntry[1]
        : null;

    const labelKeys = allowed.map(([key]) => key).join(', ');
    sceneStore.apply({
      apply: (scene) => {
        let pages = scene.pages.map((page) => ({
          ...page,
          layers: updateLayerInTree(page.layers, layerId, (layer) => {
            const data =
              typeof layer.data === 'object' && layer.data !== null
                ? { ...(layer.data as Record<string, unknown>) }
                : {};
            for (const [key, value] of allowed) {
              if (key.includes('.')) {
                setNestedValue(data, key, value);
              } else {
                data[key] = value;
              }
            }
            return { ...layer, data };
          }),
        }));
        // Bound face part: write committed content into widget values so the
        // isolate re-renders (Figma/Unlayer bind path). Same apply as the face
        // write so undo is one step and history stays consistent.
        if (widgetAncestor && bindKey && plain !== null) {
          const widgetId = widgetAncestor.id;
          pages = pages.map((page) => ({
            ...page,
            layers: updateLayerInTree(page.layers, widgetId, (layer) => {
              const data =
                typeof layer.data === 'object' && layer.data !== null
                  ? { ...(layer.data as Record<string, unknown>) }
                  : {};
              const values =
                data.values && typeof data.values === 'object'
                  ? { ...(data.values as Record<string, unknown>) }
                  : {};
              setNestedValue(values, bindKey, plain);
              return { ...layer, data: { ...data, values } };
            }),
          }));
        }
        return { ...scene, pages };
      },
      label:
        widgetAncestor && bindKey
          ? `Update ${labelKeys} (bind ${bindKey})`
          : `Update ${labelKeys}`,
    });
  }

  selectViewItem(
    viewId: string,
    item: unknown,
    options?: { additive?: boolean }
  ): void {
    const provider = this.providerRegistries.viewProviderRegistry.get(viewId);
    if (!provider) {
      return;
    }
    const ctx = this.runtime.createCommandContext();
    provider.onSelect?.(item, ctx, options);
  }

  moveViewItem(
    viewId: string,
    source: unknown,
    target: unknown,
    position: 'before' | 'after' | 'inside'
  ): void {
    const provider = this.providerRegistries.viewProviderRegistry.get(viewId);
    if (!provider) {
      return;
    }
    const ctx = this.runtime.createCommandContext();
    if (provider.canMove && !provider.canMove(source, target, position)) {
      return;
    }
    provider.handleMove?.(source, target, position, ctx);
  }

  undo(): boolean {
    return this.runtime.getScene().undo();
  }

  redo(): boolean {
    return this.runtime.getScene().redo();
  }

  async save(saveFn?: (input: EditorInput) => Promise<void>): Promise<void> {
    await saveDocument(this.documentOpsDeps, saveFn);
  }

  async saveAs(uri: string): Promise<void> {
    await saveDocumentAs(this.documentOpsDeps, uri);
  }

  async openDocument(uri: string): Promise<void> {
    await openDocument(this.documentOpsDeps, uri);
  }

  revert(): void {
    revertDocument(this.documentOpsDeps);
  }

  serializeScene(): Scene {
    return structuredClone(this.runtime.getScene().getScene());
  }

  loadScene(scene: Scene): void {
    loadSceneDocument(this.documentOpsDeps, scene);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.externalHosts.dispose();
    this.detachKeybindings?.();
    this.detachKeybindings = null;
    for (const dispose of this.eventDisposables) {
      dispose();
    }
    this.eventDisposables.length = 0;
    this.listeners.clear();
    this.interactionState.dispose();
    this.runtime.dispose();
    setTemplatePolicyEnforced(true);
  }

  /** @internal */
  getStateCacheForTest(): WorkbenchStateCache {
    return this.stateCache;
  }

  private notify(): void {
    this.revision += 1;
    this.cachedState = this.buildState();
    const state = this.cachedState;
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  private buildState(): WorkbenchState {
    const sliceCtx = this.sliceContext;
    const slices = this.stateCache.assemble(this.revision, this.layout, {
      buildChromeSlice: () => buildChromeSlice(sliceCtx),
      buildCommandsSlice: () => buildCommandsSlice(sliceCtx),
      buildEditorSlice: () => this.editorSliceBuilder.build(sliceCtx),
      buildInteractionSlice: () => this.interactionState.getState(),
      buildSceneSlice: () => buildSceneSlice(sliceCtx),
    });

    return this.assembleWorkbenchState(slices);
  }

  private assembleWorkbenchState(slices: {
    scene: SceneSlice;
    editor: EditorSlice;
    chrome: ChromeSlice;
    commands: CommandsSlice;
    interaction: InteractionSlice;
  }): WorkbenchState {
    const { scene, editor, chrome, commands, interaction } = slices;
    return {
      activeContainerByLocation:
        this.locationService.getActiveContainerByLocation(),
      commandPalette: chrome.commandPalette,
      commandStates: commands.commandStates,
      contextKeys: chrome.contextKeys,
      contextMenu: chrome.contextMenu,
      editor: editor.editor,
      editorPaneKind: editor.editorPaneKind,
      editorPanes: editor.editorPanes,
      fieldRenderers: scene.fieldRenderers,
      interaction,
      layerSurface: editor.layerSurface,
      layout: this.layout,
      overlays: chrome.overlays,
      properties: scene.properties,
      revision: this.revision,
      scene: scene.scene,
      selection: scene.selection,
      sidebarHeaders: chrome.sidebarHeaders,
      statusBar: chrome.statusBar,
      statusBarItemRenderers: chrome.statusBarItemRenderers,
      toolbarItems: chrome.toolbarItems,
      viewContainers: scene.viewContainers,
      viewLocations: this.locationService.getViewLocations(),
      viewPanels: scene.viewPanels,
    };
  }
}

const WIDGET_LAYER_TYPE = 'openenvx.widget';

function htmlToPlainText(html: string): string {
  return html
    .replaceAll(/<br\s*\/?>/gi, '\n')
    .replaceAll(/<\/p>/gi, '\n')
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll(/\n+$/g, '')
    .trim();
}

function findWidgetAncestor(scene: Scene, layerId: string): Layer | null {
  for (const page of scene.pages) {
    let found: Layer | null = null;
    walkLayers(page.layers, (layer, path) => {
      if (layer.id !== layerId) {
        return;
      }
      for (let i = path.length - 1; i >= 0; i -= 1) {
        const ancestor = path[i];
        if (ancestor?.type === WIDGET_LAYER_TYPE) {
          found = ancestor;
          return;
        }
      }
    });
    if (found) {
      return found;
    }
  }
  return null;
}
