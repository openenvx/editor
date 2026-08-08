import type {
  ExtensionActivationEvent,
  ExtensionChromeContribution,
  ExtensionContributes,
  ExtensionManifest,
  ExtensionWidgetContribution,
} from './extension-manifest';
import { isSandboxCapability } from './sandbox/types';
import { validatePluginTree } from './validate-plugin-tree';

export type ExtensionManifestValidationResult =
  | { ok: true; manifest: ExtensionManifest }
  | { ok: false; reason: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isActivationEvent(value: unknown): value is ExtensionActivationEvent {
  return (
    value === 'onStartup' ||
    (typeof value === 'string' &&
      (value.startsWith('onWidget:') ||
        value.startsWith('onCommand:') ||
        value.startsWith('onView:')))
  );
}

function validateWidgetList(
  label: string,
  list: unknown
):
  | { ok: true; widgets: ExtensionWidgetContribution[] }
  | { ok: false; reason: string } {
  if (list === undefined) {
    return { ok: true, widgets: [] };
  }
  if (!Array.isArray(list)) {
    return { ok: false, reason: `contributes.${label} must be an array` };
  }
  const widgets: ExtensionWidgetContribution[] = [];
  for (const item of list) {
    if (!isPlainObject(item)) {
      return {
        ok: false,
        reason: `contributes.${label} item must be an object`,
      };
    }
    if (typeof item.id !== 'string' || !item.id) {
      return { ok: false, reason: `contributes.${label} item requires id` };
    }
    if (typeof item.label !== 'string' || !item.label) {
      return {
        ok: false,
        reason: `contributes.${label} ${item.id}: label required`,
      };
    }
    if (!Array.isArray(item.kinds) || item.kinds.length === 0) {
      return {
        ok: false,
        reason: `contributes.${label} ${item.id}: kinds required`,
      };
    }
    for (const kind of item.kinds) {
      if (kind !== 'canvas' && kind !== 'html') {
        return {
          ok: false,
          reason: `contributes.${label} ${item.id}: invalid kind`,
        };
      }
    }
    widgets.push(item as unknown as ExtensionWidgetContribution);
  }
  return { ok: true, widgets };
}

function validateChrome(
  chrome: unknown
):
  | { ok: true; chrome: ExtensionChromeContribution }
  | { ok: false; reason: string } {
  if (chrome === undefined) {
    return { ok: true, chrome: {} };
  }
  if (!isPlainObject(chrome)) {
    return { ok: false, reason: 'contributes.chrome must be an object' };
  }
  const out: ExtensionChromeContribution = {};
  const roots: (keyof ExtensionChromeContribution)[] = [
    'menu',
    'toolbar',
    'statusBar',
    'palette',
  ];
  for (const key of roots) {
    const tree = chrome[key];
    if (tree === undefined) {
      continue;
    }
    const validated = validatePluginTree(tree);
    if (!validated.ok) {
      return {
        ok: false,
        reason: `contributes.chrome.${key}: ${validated.reason}`,
      };
    }
    out[key] = validated.root;
  }
  return { ok: true, chrome: out };
}

/**
 * Validate a static extension manifest (cold-start contract).
 * Does not execute extension code.
 */
export function validateExtensionManifest(
  input: unknown
): ExtensionManifestValidationResult {
  if (!isPlainObject(input)) {
    return { ok: false, reason: 'Manifest must be a plain object' };
  }
  if (typeof input.id !== 'string' || !input.id) {
    return { ok: false, reason: 'Manifest requires id' };
  }
  if (typeof input.name !== 'string' || !input.name) {
    return { ok: false, reason: 'Manifest requires name' };
  }
  if (!isPlainObject(input.contributes)) {
    return { ok: false, reason: 'Manifest requires contributes object' };
  }

  if (input.activation !== undefined) {
    if (!Array.isArray(input.activation)) {
      return { ok: false, reason: 'activation must be an array' };
    }
    for (const event of input.activation) {
      if (!isActivationEvent(event)) {
        return {
          ok: false,
          reason: `Invalid activation event: ${String(event)}`,
        };
      }
    }
  }

  if (input.permissions !== undefined) {
    if (!Array.isArray(input.permissions)) {
      return { ok: false, reason: 'permissions must be an array' };
    }
    for (const cap of input.permissions) {
      if (typeof cap !== 'string' || !isSandboxCapability(cap)) {
        return { ok: false, reason: `Unknown permission: ${String(cap)}` };
      }
    }
  }

  if (input.requestedCommands !== undefined) {
    if (!Array.isArray(input.requestedCommands)) {
      return { ok: false, reason: 'requestedCommands must be an array' };
    }
    for (const commandId of input.requestedCommands) {
      if (typeof commandId !== 'string' || !commandId) {
        return {
          ok: false,
          reason: 'requestedCommands items must be non-empty strings',
        };
      }
    }
  }

  const contributes = input.contributes as ExtensionContributes;
  const widgets = validateWidgetList('widgets', contributes.widgets);
  if (!widgets.ok) {
    return widgets;
  }
  const blocks = validateWidgetList('blocks', contributes.blocks);
  if (!blocks.ok) {
    return blocks;
  }

  if (contributes.commands !== undefined) {
    if (!Array.isArray(contributes.commands)) {
      return { ok: false, reason: 'contributes.commands must be an array' };
    }
    for (const cmd of contributes.commands) {
      if (
        !isPlainObject(cmd) ||
        typeof cmd.id !== 'string' ||
        typeof cmd.title !== 'string'
      ) {
        return {
          ok: false,
          reason: 'contributes.commands items need id and title',
        };
      }
    }
  }

  if (contributes.viewContainers !== undefined) {
    if (!Array.isArray(contributes.viewContainers)) {
      return {
        ok: false,
        reason: 'contributes.viewContainers must be an array',
      };
    }
    for (const container of contributes.viewContainers) {
      if (
        !isPlainObject(container) ||
        typeof container.id !== 'string' ||
        typeof container.title !== 'string'
      ) {
        return {
          ok: false,
          reason: 'contributes.viewContainers items need id and title',
        };
      }
    }
  }

  if (contributes.views !== undefined) {
    if (!Array.isArray(contributes.views)) {
      return { ok: false, reason: 'contributes.views must be an array' };
    }
    for (const view of contributes.views) {
      if (
        !isPlainObject(view) ||
        typeof view.id !== 'string' ||
        typeof view.container !== 'string'
      ) {
        return {
          ok: false,
          reason: 'contributes.views items need id and container',
        };
      }
    }
  }

  const chrome = validateChrome(contributes.chrome);
  if (!chrome.ok) {
    return chrome;
  }

  return {
    ok: true,
    manifest: {
      id: input.id,
      name: input.name,
      ...(typeof input.version === 'string' ? { version: input.version } : {}),
      ...(Array.isArray(input.activation)
        ? { activation: input.activation as ExtensionActivationEvent[] }
        : {}),
      ...(Array.isArray(input.permissions)
        ? {
            permissions: input.permissions as ExtensionManifest['permissions'],
          }
        : {}),
      ...(Array.isArray(input.requestedCommands)
        ? {
            requestedCommands: input.requestedCommands as string[],
          }
        : {}),
      contributes: {
        ...contributes,
        ...(widgets.widgets.length > 0 ? { widgets: widgets.widgets } : {}),
        ...(blocks.widgets.length > 0 ? { blocks: blocks.widgets } : {}),
        ...(chrome.chrome ? { chrome: chrome.chrome } : {}),
      },
    },
  };
}
