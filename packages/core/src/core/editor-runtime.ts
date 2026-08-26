import type { ContextKeyContribution } from '../contributions/context-key-contribution';
import { LocalizationServiceImpl } from '../i18n/localization-service';
import { LocalizationServiceId } from '../i18n/localization-service-id';
import {
  MenuChoiceRegistryImpl,
  MenuChoiceRegistryId,
} from '../menu/menu-choice-registry';
import { DisposableStore } from '../runtime/emitter';
import { InstantiationService } from '../runtime/instantiation-service';
import type { CommandContext } from '../runtime/types';
import {
  WorkbenchEventService,
  WorkbenchEvents,
} from '../runtime/workbench-events';
import type { EventBus } from '../runtime/workbench-events';
import type { SceneStore } from '../scene/scene-store';
import {
  RichTextInsertServiceImpl,
  RichTextInsertServiceId,
} from '../services/rich-text-insert-service';
import {
  ContextKeyServiceId,
  EditorServiceId,
  SceneStoreServiceId,
} from '../tokens';
import type { ContextKeyService } from '../workbench/context-key-service';
import { createContextKeyService } from '../workbench/context-key-service';
import { ContextKeySynchronizer } from '../workbench/context-key-synchronizer';
import { MutableDocumentHostService } from '../workbench/document-host-service';
import { DocumentHostServiceId } from '../workbench/document-host-service-id';
import type { EditorService } from '../workbench/editor-service';
import {
  EditorViewportServiceImpl,
  EditorViewportServiceId,
} from '../workbench/editor-viewport-service';
import { IconRegistryImpl } from '../workbench/icon-registry-service';
import { IconRegistryId } from '../workbench/icon-registry-service-id';
import { ThemeServiceImpl } from '../workbench/theme-service';
import { ThemeServiceId } from '../workbench/theme-service-id';

export class EditorRuntime {
  readonly services = new InstantiationService();
  private readonly contextKeyContributions: ContextKeyContribution[] = [];
  private readonly disposables = new DisposableStore();
  private readonly contextKeys = createContextKeyService();
  private readonly contextSynchronizer: ContextKeySynchronizer;
  private readonly events = new WorkbenchEventService();

  constructor(
    private readonly scene: SceneStore,
    private readonly editor: EditorService
  ) {
    this.installCoreServices();
    this.contextSynchronizer = new ContextKeySynchronizer(
      this.scene,
      this.editor,
      this.contextKeys
    );
    this.wireEvents();
  }

  registerContextKeyContribution(contribution: ContextKeyContribution): void {
    this.contextKeyContributions.push(contribution);
  }

  private installCoreServices(): void {
    this.services.registerInstance(SceneStoreServiceId, this.scene);
    this.services.registerInstance(EditorServiceId, this.editor);
    this.services.registerInstance(ContextKeyServiceId, this.contextKeys);
    this.services.registerInstance(
      EditorViewportServiceId,
      new EditorViewportServiceImpl()
    );
    this.services.registerInstance(
      LocalizationServiceId,
      new LocalizationServiceImpl()
    );
    this.services.registerInstance(
      MenuChoiceRegistryId,
      new MenuChoiceRegistryImpl()
    );
    this.services.registerInstance(ThemeServiceId, new ThemeServiceImpl());
    this.services.registerInstance(IconRegistryId, new IconRegistryImpl());
    this.services.registerInstance(
      DocumentHostServiceId,
      new MutableDocumentHostService()
    );
    this.services.registerInstance(
      RichTextInsertServiceId,
      new RichTextInsertServiceImpl()
    );
    const localization = this.services.get(LocalizationServiceId);
    this.disposables.add(
      localization.onDidChangeLocale((locale) => {
        this.events.emit(WorkbenchEvents.DidChangeLocale, locale);
      })
    );
  }

  private wireEvents(): void {
    this.disposables.add(
      this.scene.onDidChangeScene((snapshot) => {
        // Use the event payload — do not call getSnapshot() again (avoids a second clone).
        this.editor.updateScene(snapshot.scene, snapshot.contentRevision);
        this.syncContextKeys();
        this.events.emit(WorkbenchEvents.DidChangeScene, snapshot);
        this.events.emit(
          WorkbenchEvents.DidChangeSelection,
          snapshot.editorState
        );
      })
    );
    this.disposables.add(
      this.editor.onDidChangeDirty((isDirty) => {
        this.events.emit(WorkbenchEvents.DidChangeDirty, isDirty);
        this.syncContextKeys();
      })
    );
    this.disposables.add(
      this.editor.onDidChangeActiveEditor((activeEditor) => {
        this.events.emit(WorkbenchEvents.DidChangeActiveEditor, activeEditor);
        this.syncContextKeys();
      })
    );
    this.disposables.add(
      this.contextKeys.onDidChangeContext(() => {
        this.events.emit(WorkbenchEvents.DidChangeContext);
      })
    );
  }

  syncContextKeys(): void {
    const ctx = this.createCommandContext();
    const customKeys: Record<string, boolean | string | number> = {};
    for (const contribution of this.contextKeyContributions) {
      customKeys[contribution.key] = contribution.evaluate(ctx);
    }
    this.contextSynchronizer.syncSceneDerivedKeys(customKeys);
  }

  getEvents(): EventBus {
    return this.events;
  }

  getScene(): SceneStore {
    return this.scene;
  }

  getEditor(): EditorService {
    return this.editor;
  }

  getContextKeys(): ContextKeyService {
    return this.contextKeys;
  }

  createCommandContext(): CommandContext {
    return {
      editor: this.editor,
      events: this.events,
      scene: this.scene,
      selection: this.scene.getSelection(),
      services: this.services,
    };
  }

  dispose(): void {
    this.disposables.dispose();
    this.contextKeys.dispose();
    this.events.dispose();
  }
}
