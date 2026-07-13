import type { Contribution } from '../core/contribution';
import type { Plugin } from '../core/plugin';
import { LocalizationServiceImpl } from '../i18n/localization-service';
import { LocalizationServiceId } from '../i18n/localization-service-id';
import {
  MenuChoiceRegistryImpl,
  MenuChoiceRegistryId,
} from '../menu/menu-choice-registry';
import { registerContribution, Registries } from '../registries/registries';
import type { CommandService } from '../runtime/command-service';
import { DisposableStore } from '../runtime/emitter';
import type { InstantiationService } from '../runtime/instantiation-service';
import { Lifecycle } from '../runtime/lifecycle';
import type { CommandContext } from '../runtime/types';
import {
  WorkbenchEventService,
  WorkbenchEvents,
} from '../runtime/workbench-events';
import type { EventBus } from '../runtime/workbench-events';
import type { SceneStore } from '../scene/scene-store';
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

export interface PluginContext {
  register(...contributions: Contribution[]): void;
  commands: CommandService;
  events: EventBus;
  services: InstantiationService;
  scene: SceneStore;
  editor: EditorService;
  contextKeys: ContextKeyService;
}

class MutablePluginContext implements PluginContext {
  constructor(
    readonly commands: CommandService,
    readonly events: EventBus,
    readonly services: InstantiationService,
    readonly scene: SceneStore,
    readonly editor: EditorService,
    readonly contextKeys: ContextKeyService,
    private readonly registries: Registries
  ) {}

  register(...contributions: Contribution[]): void {
    const i18nContributions = contributions.filter(
      (contribution) => contribution.contributionPoint === 'i18n'
    );
    const otherContributions = contributions.filter(
      (contribution) => contribution.contributionPoint !== 'i18n'
    );
    for (const contribution of i18nContributions) {
      registerContribution(this.registries, contribution);
    }
    for (const contribution of otherContributions) {
      registerContribution(this.registries, contribution);
    }
  }
}

export class PluginManager {
  private readonly registries = new Registries();
  private readonly lifecycle = new Lifecycle();
  private readonly events = new WorkbenchEventService();
  private readonly disposables = new DisposableStore();
  private readonly scene: SceneStore;
  private readonly editor: EditorService;
  private readonly contextKeys = createContextKeyService();
  private readonly contextSynchronizer: ContextKeySynchronizer;

  constructor(scene: SceneStore, editor: EditorService) {
    this.scene = scene;
    this.editor = editor;
    this.registerCoreServices();
    this.contextSynchronizer = new ContextKeySynchronizer(
      this.scene,
      this.editor,
      this.contextKeys
    );
    this.wireEvents();
  }

  private registerCoreServices(): void {
    const { services } = this.registries;
    services.registerInstance(SceneStoreServiceId, this.scene);
    services.registerInstance(EditorServiceId, this.editor);
    services.registerInstance(ContextKeyServiceId, this.contextKeys);
    services.registerInstance(
      EditorViewportServiceId,
      new EditorViewportServiceImpl()
    );
    services.registerInstance(
      LocalizationServiceId,
      new LocalizationServiceImpl()
    );
    services.registerInstance(
      MenuChoiceRegistryId,
      new MenuChoiceRegistryImpl()
    );
    services.registerInstance(ThemeServiceId, new ThemeServiceImpl());
    services.registerInstance(IconRegistryId, new IconRegistryImpl());
    services.registerInstance(
      DocumentHostServiceId,
      new MutableDocumentHostService()
    );
    const localization = services.get(LocalizationServiceId);
    this.disposables.add(
      localization.onDidChangeLocale((locale) => {
        this.events.emit(WorkbenchEvents.DidChangeLocale, locale);
      })
    );
  }

  private wireEvents(): void {
    this.disposables.add(
      this.scene.onDidChangeScene(() => {
        const snapshot = this.scene.getSnapshot();
        this.editor.updateScene(snapshot.scene, snapshot.contentRevision);
        this.syncContextKeys();
        this.events.emit(WorkbenchEvents.DidChangeScene, snapshot);
        this.events.emit(
          WorkbenchEvents.DidChangeSelection,
          snapshot.scene.selection
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

  private syncContextKeys(): void {
    const ctx = this.createCommandContext();
    const customKeys: Record<string, boolean | string | number> = {};
    for (const contribution of this.registries.contextKeys) {
      customKeys[contribution.key] = contribution.evaluate(ctx);
    }
    this.contextSynchronizer.syncSceneDerivedKeys(customKeys);
  }

  getRegistries(): Registries {
    return this.registries;
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
      services: this.registries.services,
    };
  }

  createPluginContext(): PluginContext {
    return new MutablePluginContext(
      this.registries.commands,
      this.events,
      this.registries.services,
      this.scene,
      this.editor,
      this.contextKeys,
      this.registries
    );
  }

  async activate(plugin: Plugin): Promise<void> {
    await this.activateWithContext(plugin, this.createPluginContext());
  }

  async activateWithContext(plugin: Plugin, ctx: PluginContext): Promise<void> {
    if (this.lifecycle.isActivated(plugin.id)) {
      throw new Error(`Plugin already activated: ${plugin.id}`);
    }
    await plugin.activate(ctx);
    this.lifecycle.markActivated(plugin);
    this.syncContextKeys();
  }

  async deactivate(pluginId: string): Promise<void> {
    const plugin = this.lifecycle.markDeactivated(pluginId);
    if (!plugin?.deactivate) {
      return;
    }
    const ctx = this.createPluginContext();
    await plugin.deactivate(ctx);
  }

  async activateAll(plugins: Plugin[]): Promise<void> {
    const { ScenePlugin } = await import('../plugins/scene-plugin');
    const { CoreI18nPlugin } = await import('../plugins/core-i18n-plugin');
    await this.activate(new ScenePlugin());
    await this.activate(new CoreI18nPlugin());
    for (const plugin of plugins) {
      await this.activate(plugin);
    }
  }

  dispose(): void {
    this.disposables.dispose();
    this.contextKeys.dispose();
    this.events.dispose();
  }
}
