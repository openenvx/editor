import type { PluginNode } from '@xmazu/openenvxee-extensions/protocol';

import {
  createMenuBuilder,
  type MenuBuilder,
  type MenuItemDescriptor,
} from '../builders/menu-builder';
import { asString, isAllowedCommand, pluginNodes } from './plugin-tree-helpers';

const MENU_CHILD_TYPES = new Set([
  'Item',
  'Separator',
  'RadioGroup',
  'Submenu',
]);

function contributeMenuChildren(
  builder: MenuBuilder,
  children: PluginNode[],
  allowedCommands?: ReadonlySet<string>
): void {
  for (const child of children) {
    if (child.type === 'Item') {
      const commandId = asString(child.props.commandId);
      if (!(commandId && isAllowedCommand(commandId, allowedCommands))) {
        continue;
      }
      const item = builder.item(commandId);
      const label = asString(child.props.label);
      if (label) {
        item.label(label);
      }
      const when = asString(child.props.when);
      if (when) {
        item.when(when);
      }
      const shortcut = asString(child.props.shortcut);
      if (shortcut) {
        item.shortcut(shortcut);
      }
      continue;
    }

    if (child.type === 'Separator') {
      builder.separator(asString(child.props.id, 'separator'));
      continue;
    }

    if (child.type === 'RadioGroup') {
      builder.radioGroup(
        asString(child.props.id),
        asString(child.props.providerId),
        asString(child.props.label)
      );
      continue;
    }

    if (child.type === 'Submenu') {
      builder.submenu(
        asString(child.props.id),
        asString(child.props.label, 'Submenu'),
        (nested) => {
          contributeMenuChildren(
            nested,
            pluginNodes(child.children),
            allowedCommands
          );
        }
      );
    }
  }
}

/**
 * Drive {@link createMenuBuilder} from a plugin-protocol `Menu` tree.
 */
export function mapPluginTreeToMenu(
  root: PluginNode,
  allowedCommands?: ReadonlySet<string>
): MenuItemDescriptor[] {
  const builder = createMenuBuilder();
  contributePluginTreeToMenu(root, builder, allowedCommands);
  return builder.build();
}

/**
 * Contribute a `Menu` tree (or a single menu child) into an existing builder.
 */
export function contributePluginTreeToMenu(
  root: PluginNode,
  builder: MenuBuilder,
  allowedCommands?: ReadonlySet<string>
): void {
  if (root.type === 'Menu') {
    contributeMenuChildren(
      builder,
      pluginNodes(root.children),
      allowedCommands
    );
    return;
  }
  if (MENU_CHILD_TYPES.has(root.type)) {
    contributeMenuChildren(builder, [root], allowedCommands);
    return;
  }
  throw new Error(
    `contributePluginTreeToMenu: expected Menu root, got ${root.type}`
  );
}
