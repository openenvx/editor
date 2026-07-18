import {
  canEditLayerData,
  canSelectLayer,
  EditorRuntime,
  EditorService,
  findLayerById,
  PluginManager,
  Registry,
  SceneStore,
  updateLayerInTree,
  WorkbenchEvents,
} from '@openenvx/core';
import type {
  CommandExecutionResult,
  EditorInput,
  Scene,
  ServiceId,
} from '@openenvx/core';
import {
  createEmptySceneSnapshot,
  normalizeSceneSnapshot,
} from '@openenvx/schema';

import { bootstrapWorkbenchServices } from './bootstrap-workbench-services';
import type { ViewContainerLocation } from './contributions/view-contribution';
import { ViewProviderRegistryImpl } from './registries/view-provider-registry';
import type { WorkbenchProviderRegistries } from './registries/workbench-provider-registries';
import { WorkbenchRegistries } from './registries/workbench-registries';
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
import { ViewLocationService } from './workbench/view-location-service';
import { DEFAULT_WORKBENCH_LAYOUT } from './workbench/workbench-layout';

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

  constructor(private readonly options: WorkbenchControllerOptions) {
    this.layout = { ...DEFAULT_WORKBENCH_LAYOUT, ...options.layout };
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
    keys.setContext('workbench.primarySidebar', this.layout.primarySidebar);
    keys.setContext('workbench.secondarySidebar', this.layout.secondarySidebar);
    keys.setContext('workbench.editorArea', this.layout.editorArea);
  }

  private registerCoreServices(): void {
    bootstrapWorkbenchServices(this.runtime, this.manager.getRegistries(), {
      openDocument: (uri) => this.openDocument(uri),
      save: () => this.save(),
      saveAs: (uri) => this.saveAs(uri),
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
      selectViewItem: (viewId, item) => this.selectViewItem(viewId, item),
      serializeScene: () => this.serializeScene(),
      undo: () => this.undo(),
      updateProperty: (layerId, key, value) =>
        this.updateProperty(layerId, key, value),
    };
  }

  async start(): Promise<void> {
    await this.manager.activateCorePlugins();
    for (const plugin of this.options.plugins) {
      const ctx = createWorkbenchPluginContext(
        this.manager.createPluginContext(),
        this.workbenchRegistries,
        this.providerRegistries
      );
      await this.manager.activateWithContext(plugin, ctx);
    }
    this.stateCache.reset();
    const sceneStore = this.runtime.getScene();
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
    this.stateCache.invalidateSceneContent();
    this.notify();
  }

  updateProperty(layerId: string, key: string, value: unknown): void {
    const sceneStore = this.runtime.getScene();
    const currentScene = sceneStore.getScene();
    const targetLayer = findLayerById(currentScene, layerId);
    if (!targetLayer || !canEditLayerData(targetLayer)) {
      return;
    }
    sceneStore.apply({
      apply: (scene) => ({
        ...scene,
        pages: scene.pages.map((page) => ({
          ...page,
          layers: updateLayerInTree(page.layers, layerId, (layer) => {
            const data =
              typeof layer.data === 'object' && layer.data !== null
                ? { ...(layer.data as Record<string, unknown>) }
                : {};
            if (key.includes('.')) {
              setNestedValue(data, key, value);
            } else {
              data[key] = value;
            }
            return { ...layer, data };
          }),
        })),
      }),
      label: `Update ${key}`,
    });
  }

  selectViewItem(viewId: string, item: unknown): void {
    const provider = this.providerRegistries.viewProviderRegistry.get(viewId);
    if (!provider) {
      return;
    }
    const ctx = this.runtime.createCommandContext();
    provider.onSelect?.(item, ctx);
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
    this.detachKeybindings?.();
    this.detachKeybindings = null;
    for (const dispose of this.eventDisposables) {
      dispose();
    }
    this.eventDisposables.length = 0;
    this.listeners.clear();
    this.interactionState.dispose();
    this.runtime.dispose();
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
      statusBar: chrome.statusBar,
      statusBarItemRenderers: chrome.statusBarItemRenderers,
      toolbarItems: chrome.toolbarItems,
      viewContainers: scene.viewContainers,
      viewLocations: this.locationService.getViewLocations(),
      viewPanels: scene.viewPanels,
    };
  }
}
