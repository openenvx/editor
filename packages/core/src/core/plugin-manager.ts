import type { Contribution } from '../core/contribution';
import type { EditorRuntime } from '../core/editor-runtime';
import type { Plugin } from '../core/plugin';
import { registerContribution, Registries } from '../registries/registries';
import type { CommandService } from '../runtime/command-service';
import type { InstantiationService } from '../runtime/instantiation-service';
import { Lifecycle } from '../runtime/lifecycle';
import type { EventBus } from '../runtime/workbench-events';
import type { SceneStore } from '../scene/scene-store';
import type { ContextKeyService } from '../workbench/context-key-service';
import type { EditorService } from '../workbench/editor-service';

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
    private readonly runtime: EditorRuntime,
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
      registerContribution(this.registries, contribution, this.runtime);
    }
    for (const contribution of otherContributions) {
      registerContribution(this.registries, contribution, this.runtime);
    }
  }
}

export class PluginManager {
  private readonly registries = new Registries();
  private readonly lifecycle = new Lifecycle();

  constructor(private readonly runtime: EditorRuntime) {
    // Live lookup - contributions registered later are visible immediately.
    this.runtime
      .getScene()
      .setPageRulesLookup((layout) => this.registries.pageRules.get(layout));
  }

  getRegistries(): Registries {
    return this.registries;
  }

  createPluginContext(): PluginContext {
    return new MutablePluginContext(
      this.registries.commands,
      this.runtime.getEvents(),
      this.runtime.services,
      this.runtime.getScene(),
      this.runtime.getEditor(),
      this.runtime.getContextKeys(),
      this.runtime,
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
    this.runtime.syncContextKeys();
  }

  async deactivate(pluginId: string): Promise<void> {
    const plugin = this.lifecycle.markDeactivated(pluginId);
    if (!plugin?.deactivate) {
      return;
    }
    const ctx = this.createPluginContext();
    await plugin.deactivate(ctx);
  }

  async activateCorePlugins(): Promise<void> {
    const { ScenePlugin } = await import('../plugins/scene-plugin');
    const { CoreI18nPlugin } = await import('../plugins/core-i18n-plugin');
    await this.activate(new ScenePlugin());
    await this.activate(new CoreI18nPlugin());
  }

  async activateAll(plugins: Plugin[]): Promise<void> {
    await this.activateCorePlugins();
    for (const plugin of plugins) {
      await this.activate(plugin);
    }
    this.runtime.getScene().renormalize();
  }
}
