import type { Command } from '../contributions/command';
import type { ContextKeyContribution } from '../contributions/context-key-contribution';
import type { LayerDefinition } from '../contributions/layer-definition';
import type { ServiceContribution } from '../contributions/service-contribution';
import type { ShortcutContribution } from '../contributions/shortcut-contribution';
import type { Contribution } from '../core/contribution';
import { I18nBundleRegistry } from '../i18n/i18n-bundle-registry';
import type { I18nContribution } from '../i18n/i18n-contribution';
import { LocalizationServiceId } from '../i18n/localization-service-id';
import { CommandService } from '../runtime/command-service';
import { InstantiationService } from '../runtime/instantiation-service';
import { KeybindingService } from '../runtime/keybinding-service';

export class Registries {
  readonly commands = new CommandService();
  readonly keybindings = new KeybindingService();
  readonly layers = new LayerRegistry();
  readonly contextKeys: ContextKeyContribution[] = [];
  readonly i18nContributions: I18nContribution[] = [];
  readonly services = new InstantiationService();
}

export class LayerRegistry {
  private readonly definitions = new Map<string, LayerDefinition>();

  register(definition: LayerDefinition): void {
    if (this.definitions.has(definition.type)) {
      throw new Error(`Layer type already registered: ${definition.type}`);
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
  contribution: Contribution
): void {
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
      registries.contextKeys.push(contribution as ContextKeyContribution);
      break;
    }
    case 'service': {
      const service = contribution as ServiceContribution;
      registries.services.registerFactory(service.token, service.getFactory());
      break;
    }
    case 'i18n': {
      const i18n = contribution as I18nContribution;
      registries.i18nContributions.push(i18n);
      if (registries.services.has(LocalizationServiceId)) {
        const localization = registries.services.get(LocalizationServiceId);
        const registry = new I18nBundleRegistry(i18n.sourceId, localization);
        i18n.contribute(registry);
      }
      break;
    }
    default: {
      throw new Error(
        `Unknown contribution point: ${(contribution as Contribution).contributionPoint}`
      );
    }
  }
}
