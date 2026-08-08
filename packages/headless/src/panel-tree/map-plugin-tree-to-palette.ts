import type { PluginNode } from '@xmazu/openenvxee-extensions/protocol';

import {
  createCommandPaletteBuilder,
  type CommandPaletteBuilder,
  type CommandPaletteContributionBuild,
} from '../builders/command-palette-builder';
import { asString, isAllowedCommand, pluginNodes } from './plugin-tree-helpers';

/**
 * Drive {@link createCommandPaletteBuilder} from a plugin-protocol `Palette` tree.
 */
export function mapPluginTreeToPalette(
  root: PluginNode,
  allowedCommands?: ReadonlySet<string>
): CommandPaletteContributionBuild {
  const builder = createCommandPaletteBuilder();
  contributePluginTreeToPalette(root, builder, allowedCommands);
  return builder.build();
}

export function contributePluginTreeToPalette(
  root: PluginNode,
  builder: CommandPaletteBuilder,
  allowedCommands?: ReadonlySet<string>
): void {
  if (root.type !== 'Palette') {
    throw new Error(
      `contributePluginTreeToPalette: expected Palette root, got ${root.type}`
    );
  }

  for (const child of pluginNodes(root.children)) {
    if (child.type === 'PaletteTab') {
      builder.tab(asString(child.props.id), asString(child.props.label));
      continue;
    }

    if (child.type === 'PaletteCategory') {
      builder.category(asString(child.props.id), asString(child.props.label));
      continue;
    }

    if (child.type === 'PaletteItem') {
      const commandId = asString(child.props.commandId);
      if (!(commandId && isAllowedCommand(commandId, allowedCommands))) {
        continue;
      }
      const item = builder.item(commandId);
      const label = asString(child.props.label);
      if (label) {
        item.label(label);
      }
      const category = asString(child.props.category);
      if (category) {
        item.category(category);
      }
      const tab = asString(child.props.tab);
      if (tab) {
        item.tab(tab);
      }
      const when = asString(child.props.when);
      if (when) {
        item.when(when);
      }
      const shortcut = asString(child.props.shortcut);
      if (shortcut) {
        item.shortcut(shortcut);
      }
      if (Array.isArray(child.props.keywords)) {
        const keywords = child.props.keywords.filter(
          (value): value is string => typeof value === 'string'
        );
        if (keywords.length > 0) {
          item.keywords(...keywords);
        }
      }
      if (child.props.hidden === true) {
        item.hide();
      }
    }
  }
}
