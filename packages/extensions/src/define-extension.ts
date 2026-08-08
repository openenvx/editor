import type { RegisteredWidget } from './define-component';
import type {
  ExtensionActivationEvent,
  ExtensionChromeContribution,
  ExtensionContributes,
  ExtensionManifest,
  SandboxCapability,
} from './protocol';

export interface DefineExtensionOptions {
  id: string;
  name: string;
  version?: string;
  activation?: ExtensionActivationEvent[];
  permissions?: SandboxCapability[];
  /**
   * Command ids the isolate may call via `openenvx.executeCommand`.
   * Distinct from `contributes.commands` (UI commands the host registers).
   */
  requestedCommands?: string[];
  contributes: {
    widgets?: RegisteredWidget[];
    blocks?: RegisteredWidget[];
    commands?: ExtensionContributes['commands'];
    viewContainers?: ExtensionContributes['viewContainers'];
    views?: ExtensionContributes['views'];
    /** Pre-serialized chrome trees (from renderPanelTree / emit CLI). */
    chrome?: ExtensionChromeContribution;
  };
}

/**
 * Author an extension. Returns a serializable {@link ExtensionManifest}
 * suitable for `openenvx.extension.json` and host activation.
 */
export function defineExtension(
  options: DefineExtensionOptions
): ExtensionManifest {
  if (!options.id || typeof options.id !== 'string') {
    throw new Error(
      '@xmazu/openenvxee-extensions: defineExtension requires id'
    );
  }
  if (!options.name || typeof options.name !== 'string') {
    throw new Error(
      '@xmazu/openenvxee-extensions: defineExtension requires name'
    );
  }

  const toWidgetContrib = (entry: RegisteredWidget) => ({
    id: entry.manifest.id,
    label: entry.manifest.label,
    ...(entry.manifest.icon ? { icon: entry.manifest.icon } : {}),
    kinds: entry.manifest.kinds,
    fields: entry.manifest.fields,
    defaults: entry.manifest.defaults,
  });

  return {
    id: options.id,
    name: options.name,
    ...(options.version ? { version: options.version } : {}),
    ...(options.activation ? { activation: options.activation } : {}),
    ...(options.permissions ? { permissions: options.permissions } : {}),
    ...(options.requestedCommands
      ? { requestedCommands: options.requestedCommands }
      : {}),
    contributes: {
      ...(options.contributes.widgets
        ? { widgets: options.contributes.widgets.map(toWidgetContrib) }
        : {}),
      ...(options.contributes.blocks
        ? { blocks: options.contributes.blocks.map(toWidgetContrib) }
        : {}),
      ...(options.contributes.commands
        ? { commands: options.contributes.commands }
        : {}),
      ...(options.contributes.viewContainers
        ? { viewContainers: options.contributes.viewContainers }
        : {}),
      ...(options.contributes.views
        ? { views: options.contributes.views }
        : {}),
      ...(options.contributes.chrome
        ? { chrome: options.contributes.chrome }
        : {}),
    },
  };
}
