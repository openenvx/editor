import type {
  PluginChild,
  PluginNode,
  PluginPropValue,
} from '@xmazu/openenvxee-protocol';

import type { ShellDropdownMenuItemDescriptor } from '../builders/shell-dropdown';

export function asString(
  value: PluginPropValue | undefined,
  fallback = ''
): string {
  return typeof value === 'string' ? value : fallback;
}

export function asNumber(
  value: PluginPropValue | undefined
): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

export function asBoolean(
  value: PluginPropValue | undefined,
  fallback = false
): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function isPluginNode(child: PluginChild): child is PluginNode {
  return typeof child === 'object' && child !== null && 'type' in child;
}

export function pluginNodes(children: PluginChild[]): PluginNode[] {
  return children.filter(isPluginNode);
}

export function shellOptions(props: PluginNode['props']): {
  when?: string;
  priority?: number;
} {
  return {
    ...(typeof props.when === 'string' ? { when: props.when } : {}),
    ...(typeof props.priority === 'number' ? { priority: props.priority } : {}),
  };
}

export function parseDropdownItems(
  children: PluginNode[],
  allowedCommands?: ReadonlySet<string>
): ShellDropdownMenuItemDescriptor[] {
  const items: ShellDropdownMenuItemDescriptor[] = [];
  for (const child of children) {
    if (child.type !== 'Item') {
      continue;
    }
    const commandId = asString(child.props.commandId);
    if (!commandId) {
      continue;
    }
    if (allowedCommands && !allowedCommands.has(commandId)) {
      continue;
    }
    items.push({
      commandId,
      ...(typeof child.props.label === 'string'
        ? { label: child.props.label }
        : {}),
      ...(typeof child.props.labelKey === 'string'
        ? { labelKey: child.props.labelKey }
        : {}),
      ...(typeof child.props.when === 'string'
        ? { when: child.props.when }
        : {}),
      ...(typeof child.props.shortcut === 'string'
        ? { shortcut: child.props.shortcut }
        : {}),
    });
  }
  return items;
}

export function isAllowedCommand(
  commandId: string,
  allowedCommands?: ReadonlySet<string>
): boolean {
  return !allowedCommands || allowedCommands.has(commandId);
}

/** Isolate mapper failures so one bad contribution cannot take down chrome rebuild. */
export function safeContribute(run: () => void): void {
  try {
    run();
  } catch {
    // ponytail: untrusted trees validated at register; still fail soft at contribute
  }
}
