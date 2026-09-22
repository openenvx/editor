import type { Command } from '../contributions/command';
import type { ContextKeyContribution } from '../contributions/context-key-contribution';
import type { LayerDefinition } from '../contributions/layer-definition';
import type { NodeCompilerContribution } from '../contributions/node-compiler-contribution';
import type { NodeDefinition } from '../contributions/node-definition';
import type { NodeInspectorContribution } from '../contributions/node-inspector-contribution';
import type { NodeTreeContribution } from '../contributions/node-tree-contribution';
import type { PageRulesContribution } from '../contributions/page-rules-contribution';
import type { ServiceContribution } from '../contributions/service-contribution';
import type { ShortcutContribution } from '../contributions/shortcut-contribution';
import { I18nBundleRegistry } from '../i18n/i18n-bundle-registry';
import type { I18nContribution } from '../i18n/i18n-contribution';
import { LocalizationServiceId } from '../i18n/localization-service-id';
import { CommandService } from '../runtime/command-service';
import type { Contribution } from '../runtime/contribution';
import type { EditorRuntime } from '../runtime/editor-runtime';
import type { Disposable } from '../runtime/emitter';
import { KeybindingService } from '../runtime/keybinding-service';
import { Registry } from './registry';

export class Registries {
  readonly commands = new CommandService();
  readonly keybindings = new KeybindingService();
  readonly layers = new LayerRegistry();
  /** Alias for layer definitions (document nodes). */
  readonly nodes = this.layers;
  readonly nodeDefinitions = new NodeDefinitionRegistry();
  readonly nodeInspectors = new NodeInspectorRegistry();
  readonly nodeTrees = new NodeTreeRegistry();
  readonly nodeCompilers = new NodeCompilerRegistry();
  readonly pageRules = new Registry<string, PageRulesContribution>('overwrite');
  readonly i18nContributions: I18nContribution[] = [];
}

export class LayerRegistry {
  private readonly definitions = new Map<string, LayerDefinition>();

  register(definition: LayerDefinition): Disposable {
    if (this.definitions.has(definition.type)) {
      return { dispose: () => {} };
    }
    this.definitions.set(definition.type, definition);
    return {
      dispose: () => {
        this.definitions.delete(definition.type);
      },
    };
  }

  get(type: string): LayerDefinition | undefined {
    return this.definitions.get(type);
  }

  getAll(): LayerDefinition[] {
    return [...this.definitions.values()];
  }
}

class NodeDefinitionRegistry {
  private readonly definitions = new Map<string, NodeDefinition>();

  register(definition: NodeDefinition): Disposable {
    if (this.definitions.has(definition.type)) {
      return { dispose: () => {} };
    }
    this.definitions.set(definition.type, definition);
    return {
      dispose: () => {
        this.definitions.delete(definition.type);
      },
    };
  }

  get(type: string): NodeDefinition | undefined {
    return this.definitions.get(type);
  }
}

class NodeInspectorRegistry {
  private readonly inspectors = new Map<string, NodeInspectorContribution>();

  register(inspector: NodeInspectorContribution): Disposable {
    if (this.inspectors.has(inspector.type)) {
      return { dispose: () => {} };
    }
    this.inspectors.set(inspector.type, inspector);
    return {
      dispose: () => {
        this.inspectors.delete(inspector.type);
      },
    };
  }

  get(type: string): NodeInspectorContribution | undefined {
    return this.inspectors.get(type);
  }
}

class NodeTreeRegistry {
  private readonly trees = new Map<string, NodeTreeContribution>();

  register(tree: NodeTreeContribution): Disposable {
    if (this.trees.has(tree.type)) {
      return { dispose: () => {} };
    }
    this.trees.set(tree.type, tree);
    return {
      dispose: () => {
        this.trees.delete(tree.type);
      },
    };
  }

  get(type: string): NodeTreeContribution | undefined {
    return this.trees.get(type);
  }

  label(node: import('#studio/schema').DocumentNode): string {
    const tree = this.trees.get(node.type);
    return tree?.label(node) ?? node.type;
  }

  icon(type: string): string | undefined {
    return this.trees.get(type)?.icon;
  }
}

class NodeCompilerRegistry {
  private readonly compilers = new Map<string, NodeCompilerContribution>();

  register(compiler: NodeCompilerContribution): Disposable {
    if (this.compilers.has(compiler.type)) {
      return { dispose: () => {} };
    }
    this.compilers.set(compiler.type, compiler);
    return {
      dispose: () => {
        this.compilers.delete(compiler.type);
      },
    };
  }

  get(type: string): NodeCompilerContribution | undefined {
    return this.compilers.get(type);
  }

  lookup(type: string) {
    return this.compilers.get(type);
  }
}

export function registerContribution(
  registries: Registries,
  contribution: Contribution,
  runtime: EditorRuntime
): Disposable {
  const { services } = runtime;
  switch (contribution.contributionPoint) {
    case 'command': {
      registries.commands.register(contribution as Command);
      return {
        dispose: () => {
          registries.commands.unregister((contribution as Command).id);
        },
      };
    }
    case 'layer': {
      return registries.layers.register(contribution as LayerDefinition);
    }
    case 'nodeDefinition': {
      return registries.nodeDefinitions.register(
        contribution as NodeDefinition
      );
    }
    case 'nodeInspector': {
      return registries.nodeInspectors.register(
        contribution as NodeInspectorContribution
      );
    }
    case 'nodeTree': {
      return registries.nodeTrees.register(
        contribution as NodeTreeContribution
      );
    }
    case 'nodeCompiler': {
      return registries.nodeCompilers.register(
        contribution as NodeCompilerContribution
      );
    }
    case 'shortcut': {
      registries.keybindings.register(contribution as ShortcutContribution);
      return {
        dispose: () => {
          registries.keybindings.unregister(
            (contribution as ShortcutContribution).commandId
          );
        },
      };
    }
    case 'contextKey': {
      runtime.registerContextKeyContribution(
        contribution as ContextKeyContribution
      );
      return { dispose: () => {} };
    }
    case 'service': {
      const service = contribution as ServiceContribution;
      services.registerFactory(service.token, service.getFactory());
      return { dispose: () => {} };
    }
    case 'i18n': {
      const i18n = contribution as I18nContribution;
      registries.i18nContributions.push(i18n);
      if (services.has(LocalizationServiceId)) {
        const localization = services.get(LocalizationServiceId);
        const registry = new I18nBundleRegistry(i18n.sourceId, localization);
        i18n.contribute(registry);
      }
      return { dispose: () => {} };
    }
    case 'pageRules': {
      const rules = contribution as PageRulesContribution;
      registries.pageRules.register(rules.layout, rules);
      return { dispose: () => {} };
    }
    default: {
      throw new Error(
        `Unknown contribution point: ${(contribution as Contribution).contributionPoint}`
      );
    }
  }
}
