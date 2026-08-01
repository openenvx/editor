import type { Command } from '../contributions/command';
import type { ContextKeyContribution } from '../contributions/context-key-contribution';
import type { LayerDefinition } from '../contributions/layer-definition';
import type { PageRulesContribution } from '../contributions/page-rules-contribution';
import type { ServiceContribution } from '../contributions/service-contribution';
import type { ShortcutContribution } from '../contributions/shortcut-contribution';
import type { Contribution } from '../core/contribution';
import type { EditorRuntime } from '../core/editor-runtime';
import { I18nBundleRegistry } from '../i18n/i18n-bundle-registry';
import type { I18nContribution } from '../i18n/i18n-contribution';
import { LocalizationServiceId } from '../i18n/localization-service-id';
import { CommandService } from '../runtime/command-service';
import { KeybindingService } from '../runtime/keybinding-service';
import { Registry } from './registry';

export class Registries {
  readonly commands = new CommandService();
  readonly keybindings = new KeybindingService();
  readonly layers = new LayerRegistry();
  readonly pageRules = new Registry<string, PageRulesContribution>('overwrite');
  readonly i18nContributions: I18nContribution[] = [];
}

export class LayerRegistry {
  private readonly definitions = new Map<string, LayerDefinition>();

  /**
   * First registration wins. Canvas + HTML plugins both register the shared
   * `openenvx.widget` definition; dual-engine hosts must not throw.
   */
  register(definition: LayerDefinition): void {
    if (this.definitions.has(definition.type)) {
      return;
    }
    this.definitions.set(definition.type, definition);
  }

  get(type: string): LayerDefinition | undefined {
    return this.definitions.get(type);
  }

  getAll(): LayerDefinition[] {
    return [...this.definitions.values()];
  }
}

export function registerContribution(
  registries: Registries,
  contribution: Contribution,
  runtime: EditorRuntime
): void {
  const { services } = runtime;
  switch (contribution.contributionPoint) {
    case 'command': {
      registries.commands.register(contribution as Command);
      break;
    }
    case 'layer': {
      registries.layers.register(contribution as LayerDefinition);
      break;
    }
    case 'shortcut': {
      registries.keybindings.register(contribution as ShortcutContribution);
      break;
    }
    case 'contextKey': {
      runtime.registerContextKeyContribution(
        contribution as ContextKeyContribution
      );
      break;
    }
    case 'service': {
      const service = contribution as ServiceContribution;
      services.registerFactory(service.token, service.getFactory());
      break;
    }
    case 'i18n': {
      const i18n = contribution as I18nContribution;
      registries.i18nContributions.push(i18n);
      if (services.has(LocalizationServiceId)) {
        const localization = services.get(LocalizationServiceId);
        const registry = new I18nBundleRegistry(i18n.sourceId, localization);
        i18n.contribute(registry);
      }
      break;
    }
    case 'pageRules': {
      const rules = contribution as PageRulesContribution;
      registries.pageRules.register(rules.layout, rules);
      break;
    }
    default: {
      throw new Error(
        `Unknown contribution point: ${(contribution as Contribution).contributionPoint}`
      );
    }
  }
}
