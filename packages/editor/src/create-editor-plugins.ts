import {
  createEmptyProjectSnapshot,
  normalizeDocument,
  normalizeProjectSnapshot,
  type Document,
} from '@openenvx/editor/schema';
import {
  Plugin,
  WorkbenchEvents,
  WorkbenchPlugin,
  type PluginContext,
  type WorkbenchPluginContext,
} from '@openenvx/studio';
import type { SliceBuilders } from '@openenvx/studio/internal';

import { ScenePlugin } from './plugins/scene-plugin';
import { VariablesPlugin } from './plugins/variables/variables-plugin';
import { DocumentStore } from './scene/document-store';
import { setTemplatePolicyEnforced } from './scene/layer-editability';
import type { EditorSession, LiveProjectSnapshot } from './scene/types';
import { EditorSliceBuilder } from './state/editor-slice-builder';
import {
  buildSceneSlice,
  buildSelectionDerivedPatch,
} from './state/scene-slice-builder';
import {
  DocumentHostServiceId,
  DocumentOperationsServiceId,
  DocumentStoreServiceId,
  EditorServiceId,
} from './tokens';
import {
  LayersTreeProvider,
  PagesTreeProvider,
  WorkbenchLayersView,
  WorkbenchPagesView,
  WorkbenchSidebarContainer,
  WorkbenchStatusBarContribution,
  WORKBENCH_LAYERS_VIEW_ID,
  WORKBENCH_PAGES_VIEW_ID,
} from './views/workbench-chrome-contributions';
import { ContextKeySynchronizer } from './workbench/context-key-synchronizer';
import { MutableDocumentHostService } from './workbench/document-host-service';
import type { DocumentOperationsService } from './workbench/document-operations-service';
import { EditorService } from './workbench/editor-service';
import {
  openDocument,
  saveDocument,
  saveDocumentAs,
} from './workbench/workbench-document-ops';

export interface CreateEditorPluginsOptions {
  document: Document;
  session?: EditorSession;
  editorUri?: string;
  editorTitle?: string;
  enforceTemplatePolicy?: boolean;
  onDocumentChange?: (document: Document) => void;
  onOpenDocument?: (uri: string) => Promise<void> | void;
  onSaveAs?: (uri: string) => Promise<void> | void;
}

export type EditorSliceBuilders = Pick<
  SliceBuilders,
  'buildSceneSlice' | 'buildEditorSlice'
> & {
  buildSelectionDerivedPatch: typeof buildSelectionDerivedPatch;
};

export interface CreateEditorPluginsResult {
  plugins: Plugin[];
  sliceBuilders: EditorSliceBuilders;
}

class EditorDocumentPlugin extends Plugin {
  readonly id = 'openenvx.editor-document';
  private disposables: (() => void)[] = [];

  constructor(
    private readonly store: DocumentStore,
    private readonly editorService: EditorService,
    private readonly options: CreateEditorPluginsOptions
  ) {
    super();
  }

  activate(ctx: PluginContext): void {
    ctx.services.registerInstance(DocumentStoreServiceId, this.store);
    ctx.services.registerInstance(EditorServiceId, this.editorService);

    const documentOpsDeps = {
      sceneStore: this.store,
      editorService: this.editorService,
      getService: <T>(id: import('@openenvx/studio').ServiceId<T>) =>
        ctx.services.get(id),
    };
    const documentOps: DocumentOperationsService = {
      save: () => saveDocument(documentOpsDeps),
      saveAs: (uri) => saveDocumentAs(documentOpsDeps, uri),
      openDocument: (uri) => openDocument(documentOpsDeps, uri),
    };
    ctx.services.registerInstance(DocumentOperationsServiceId, documentOps);
    ctx.services.registerInstance(
      DocumentHostServiceId,
      new MutableDocumentHostService()
    );

    const synchronizer = new ContextKeySynchronizer(
      this.store,
      this.editorService,
      ctx.contextKeys
    );

    const syncKeys = () => {
      if (synchronizer.syncSceneDerivedKeys({})) {
        ctx.events.emit(WorkbenchEvents.DidChangeContext);
      }
    };

    const documentSub = this.store.onDidChangeDocument(
      (snapshot: LiveProjectSnapshot) => {
        this.editorService.updateScene(
          snapshot.document,
          snapshot.contentRevision
        );
        ctx.events.emit(
          WorkbenchEvents.DidChangeDocument,
          snapshot as import('@openenvx/studio').WorkbenchEventPayloads[typeof WorkbenchEvents.DidChangeDocument]
        );
        syncKeys();
        this.options.onDocumentChange?.(snapshot.document);
      }
    );
    const dirtySub = this.editorService.onDidChangeDirty((dirty) => {
      syncKeys();
      ctx.events.emit(WorkbenchEvents.DidChangeDirty, dirty);
    });
    const activeEditorSub = this.editorService.onDidChangeActiveEditor(() => {
      syncKeys();
      ctx.events.emit(
        WorkbenchEvents.DidChangeActiveEditor,
        this.editorService.getActiveEditor()
      );
    });
    this.disposables.push(
      () => documentSub.dispose(),
      () => dirtySub.dispose(),
      () => activeEditorSub.dispose()
    );

    const openInput = {
      isDirty: false,
      scene: this.store.getDocument(),
      title: this.options.editorTitle ?? 'Untitled',
      uri: this.options.editorUri ?? 'untitled://scene',
    };
    this.editorService.open(
      openInput,
      this.store.getContentRevision(),
      this.store.getSession()
    );
    syncKeys();
  }

  deactivate(): void {
    for (const dispose of this.disposables) {
      dispose();
    }
    this.disposables = [];
  }
}

class EditorChromeWorkbenchPlugin extends WorkbenchPlugin {
  readonly id = 'openenvx.editor-chrome';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(
      new WorkbenchSidebarContainer(),
      new WorkbenchPagesView(),
      new WorkbenchLayersView(),
      new WorkbenchStatusBarContribution()
    );
    ctx.registerTreeDataProvider(
      WORKBENCH_PAGES_VIEW_ID,
      new PagesTreeProvider()
    );
    ctx.registerTreeDataProvider(
      WORKBENCH_LAYERS_VIEW_ID,
      new LayersTreeProvider()
    );
  }
}

const editorSliceBuilder = new EditorSliceBuilder();

export function createEditorPlugins(
  options: CreateEditorPluginsOptions
): CreateEditorPluginsResult {
  setTemplatePolicyEnforced(options.enforceTemplatePolicy !== false);
  const snapshot = normalizeProjectSnapshot({
    document: normalizeDocument(options.document),
    ...(options.session ? { session: options.session } : {}),
  });
  const store = new DocumentStore(snapshot.document, snapshot.session);
  const editorService = new EditorService();

  const plugins: Plugin[] = [
    new EditorDocumentPlugin(store, editorService, options),
    new ScenePlugin(),
    new VariablesPlugin(),
    new EditorChromeWorkbenchPlugin(),
  ];

  return {
    plugins,
    sliceBuilders: {
      buildEditorSlice: (ctx) => editorSliceBuilder.build(ctx),
      buildSceneSlice: (ctx) => buildSceneSlice(ctx),
      buildSelectionDerivedPatch,
    },
  };
}

export function createEmptyEditorPlugins(): CreateEditorPluginsResult {
  return createEditorPlugins({
    document: createEmptyProjectSnapshot().document,
  });
}
