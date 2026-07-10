import {
  DocumentOperationsServiceId,
  EditorService,
  findLayerById,
  isLayerEditable,
  LayerRegistryServiceId,
  PluginManager,
  SceneStore,
  DEFAULT_WORKBENCH_LAYOUT,
  updateLayerInTree,
  WorkbenchEvents,
} from '@openenvx/core';
import type {
  CommandExecutionResult,
  EditorInput,
  Scene,
  ServiceId,
} from '@openenvx/core';

import { buildChromeSlice } from './state/chrome-slice-builder';
import { buildCommandsSlice } from './state/commands-slice-builder';
import { EditorSliceBuilder } from './state/editor-slice-builder';
import { buildSceneSlice } from './state/scene-slice-builder';
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
  SceneSlice,
} from './workbench-state-cache';

type Listener = (state: WorkbenchState) => void;

export class WorkbenchController {
  private readonly sceneStore: SceneStore;
  private readonly editorService = new EditorService();
  private readonly manager: PluginManager;
  private readonly layout: WorkbenchSliceContext['layout'];
  private readonly listeners = new Set<Listener>();
  private readonly eventDisposables: (() => void)[] = [];
  private readonly stateCache = new WorkbenchStateCache();
  private readonly editorSliceBuilder = new EditorSliceBuilder();
  private revision = 0;
  private disposed = false;
  private detachKeybindings: (() => void) | null = null;
  private lastSeenContentRevision = -1;

  constructor(private readonly options: WorkbenchControllerOptions) {
    this.layout = { ...DEFAULT_WORKBENCH_LAYOUT, ...options.layout };
    this.sceneStore = new SceneStore(options.initialScene);
    this.manager = new PluginManager(this.sceneStore, this.editorService);
    this.registerCoreServices();
    this.syncLayoutContextKeys();
    this.wireStateRefresh();
  }

  private get sliceContext(): WorkbenchSliceContext {
    return {
      editorService: this.editorService,
      layout: this.layout,
      manager: this.manager,
      sceneStore: this.sceneStore,
    };
  }

  private get documentOpsDeps() {
    return {
      editorService: this.editorService,
      getService: <T>(token: ServiceId<T>) => this.getService(token),
      sceneStore: this.sceneStore,
    };
  }

  private syncLayoutContextKeys(): void {
    const keys = this.manager.getContextKeys();
    keys.setContext('workbench.floatingToolbar', this.layout.floatingToolbar);
    keys.setContext('workbench.statusBar', this.layout.statusBar);
    keys.setContext('workbench.primarySidebar', this.layout.primarySidebar);
    keys.setContext('workbench.secondarySidebar', this.layout.secondarySidebar);
    keys.setContext('workbench.editorArea', this.layout.editorArea);
  }

  private registerCoreServices(): void {
    const services = this.manager.getRegistries().services;
    services.registerInstance(
      LayerRegistryServiceId,
      this.manager.getRegistries().layers
    );
    services.registerInstance(DocumentOperationsServiceId, {
      openDocument: (uri) => this.openDocument(uri),
      save: () => this.save(),
      saveAs: (uri) => this.saveAs(uri),
    });
  }

  private wireStateRefresh(): void {
    const events = this.manager.getEvents();
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
            snapshot.contentRevision
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
      })
    );
  }

  get api(): WorkbenchApi {
    return {
      commands: this.manager.getRegistries().commands,
      editor: this.editorService,
      events: this.manager.getEvents(),
      executeCommand: (id, args) => this.executeCommand(id, args),
      runCommand: (id, args) => this.runCommand(id, args),
      subscribe: (listener) => this.subscribe(listener),
      registerServiceInstance: (id, instance) =>
        this.registerServiceInstance(id, instance),
      getService: (token) => this.getService(token),
      getState: () => this.getState(),
      loadScene: (scene) => this.loadScene(scene),
      moveViewItem: (viewId, source, target, position) =>
        this.moveViewItem(viewId, source, target, position),
      redo: () => this.redo(),
      revert: () => this.revert(),
      save: (saveFn) => this.save(saveFn),
      saveAs: (uri) => this.saveAs(uri),
      openDocument: (uri) => this.openDocument(uri),
      scene: this.sceneStore,
      selectLayers: (layerIds, primaryLayerId) =>
        this.selectLayers(layerIds, primaryLayerId),
      selectViewItem: (viewId, item) => this.selectViewItem(viewId, item),
      serializeScene: () => this.serializeScene(),
      undo: () => this.undo(),
      updateProperty: (layerId, key, value) =>
        this.updateProperty(layerId, key, value),
    };
  }

  async start(): Promise<void> {
    await this.manager.activateAll(this.options.plugins);
    this.stateCache.reset();
    this.lastSeenContentRevision = this.sceneStore.getContentRevision();
    this.stateCache.onSceneContentRevision(this.lastSeenContentRevision);
    this.editorService.open(
      {
        isDirty: false,
        scene: this.sceneStore.getScene(),
        title: this.options.editorTitle ?? 'Untitled',
        uri: this.options.editorUri ?? 'untitled://scene',
      },
      this.sceneStore.getContentRevision()
    );
    this.detachKeybindings = attachWorkbenchKeybindings(this.manager);
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
    const ctx = this.manager.createCommandContext();
    return this.manager
      .getRegistries()
      .commands.execute(
        commandId,
        ctx,
        this.manager.getEvents(),
        args
      ) as Promise<CommandExecutionResult<T>>;
  }

  getState(): WorkbenchState {
    return this.buildState();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.buildState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getService<T>(token: ServiceId<T>): T | undefined {
    const services = this.manager.getRegistries().services;
    if (!services.has(token)) {
      return undefined;
    }
    return services.get(token);
  }

  registerServiceInstance<T>(id: ServiceId<T>, instance: T): void {
    this.manager.getRegistries().services.registerInstance(id, instance);
    this.stateCache.invalidateChrome();
    this.notify();
  }

  selectLayers(layerIds: string[], primaryLayerId?: string | null): void {
    const currentScene = this.sceneStore.getScene();
    const editableIds = layerIds.filter((id) => {
      const targetLayer = findLayerById(currentScene, id);
      return targetLayer && isLayerEditable(targetLayer);
    });
    if (editableIds.length === 0) {
      this.sceneStore.selectLayers([], null);
      return;
    }
    const validPrimary =
      primaryLayerId && editableIds.includes(primaryLayerId)
        ? primaryLayerId
        : editableIds[0];
    this.sceneStore.selectLayers(editableIds, validPrimary ?? null);
  }

  updateProperty(layerId: string, key: string, value: unknown): void {
    const currentScene = this.sceneStore.getScene();
    const targetLayer = findLayerById(currentScene, layerId);
    if (!targetLayer || !isLayerEditable(targetLayer)) {
      return;
    }
    this.sceneStore.apply({
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
    const view = this.manager
      .getRegistries()
      .views.find((v) => v.id === viewId);
    if (!view) {
      return;
    }
    const provider = view.createProvider();
    const ctx = this.manager.createCommandContext();
    provider.onSelect?.(item, ctx);
  }

  moveViewItem(
    viewId: string,
    source: unknown,
    target: unknown,
    position: 'before' | 'after' | 'inside'
  ): void {
    const view = this.manager
      .getRegistries()
      .views.find((v) => v.id === viewId);
    if (!view) {
      return;
    }
    const provider = view.createProvider();
    const ctx = this.manager.createCommandContext();
    if (provider.canMove && !provider.canMove(source, target, position)) {
      return;
    }
    provider.handleMove?.(source, target, position, ctx);
  }

  undo(): boolean {
    return this.sceneStore.undo();
  }

  redo(): boolean {
    return this.sceneStore.redo();
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
    return structuredClone(this.sceneStore.getScene());
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
    this.manager.dispose();
  }

  /** @internal */
  getStateCacheForTest(): WorkbenchStateCache {
    return this.stateCache;
  }

  private notify(): void {
    this.revision += 1;
    const state = this.buildState();
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
      buildSceneSlice: () => buildSceneSlice(sliceCtx),
    });

    return this.assembleWorkbenchState(slices);
  }

  private assembleWorkbenchState(slices: {
    scene: SceneSlice;
    editor: EditorSlice;
    chrome: ChromeSlice;
    commands: CommandsSlice;
  }): WorkbenchState {
    const { scene, editor, chrome, commands } = slices;
    return {
      commandPalette: chrome.commandPalette,
      commandStates: commands.commandStates,
      contextKeys: chrome.contextKeys,
      contextMenu: chrome.contextMenu,
      editor: editor.editor,
      editorPaneKind: editor.editorPaneKind,
      editorPanes: editor.editorPanes,
      fieldRenderers: scene.fieldRenderers,
      inspectorPanes: scene.inspectorPanes,
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
    };
  }
}
