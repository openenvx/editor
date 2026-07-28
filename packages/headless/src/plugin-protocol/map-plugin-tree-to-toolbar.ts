import type { PluginNode } from '@xmazu/openenvxee-plugin-protocol';

import {
  createToolbarBuilder,
  type ToolbarBuilder,
  type ToolbarItemDescriptor,
} from '../builders/toolbar-builder';
import {
  asNumber,
  asString,
  isAllowedCommand,
  parseDropdownItems,
  pluginNodes,
  shellOptions,
} from './plugin-tree-helpers';

/**
 * Drive {@link createToolbarBuilder} from a plugin-protocol `Toolbar` tree.
 */
export function mapPluginTreeToToolbar(
  root: PluginNode,
  allowedCommands?: ReadonlySet<string>
): ToolbarItemDescriptor[] {
  const builder = createToolbarBuilder();
  contributePluginTreeToToolbar(root, builder, allowedCommands);
  return builder.build();
}

export function contributePluginTreeToToolbar(
  root: PluginNode,
  builder: ToolbarBuilder,
  allowedCommands?: ReadonlySet<string>
): void {
  if (root.type !== 'Toolbar') {
    throw new Error(
      `contributePluginTreeToToolbar: expected Toolbar root, got ${root.type}`
    );
  }

  for (const child of pluginNodes(root.children)) {
    const options = shellOptions(child.props);
    const group = asNumber(child.props.group);

    if (child.type === 'ToolbarCommand') {
      const commandId = asString(child.props.commandId);
      if (!isAllowedCommand(commandId, allowedCommands)) {
        continue;
      }
      builder.command(asString(child.props.id), {
        commandId,
        icon: asString(child.props.icon),
        labelKey: asString(child.props.labelKey),
        ...options,
        ...(group === undefined ? {} : { group }),
      });
      continue;
    }

    if (child.type === 'Separator') {
      builder.separator(asString(child.props.id, 'separator'), {
        ...options,
        ...(group === undefined ? {} : { group }),
      });
      continue;
    }

    if (child.type === 'ToolbarDropdown') {
      builder.dropdown(asString(child.props.id), {
        items: parseDropdownItems(pluginNodes(child.children), allowedCommands),
        ...(typeof child.props.label === 'string'
          ? { label: child.props.label }
          : {}),
        ...(typeof child.props.labelBinding === 'string'
          ? { labelBinding: child.props.labelBinding }
          : {}),
        ...(typeof child.props.labelSuffix === 'string'
          ? { labelSuffix: child.props.labelSuffix }
          : {}),
        ...options,
        ...(group === undefined ? {} : { group }),
      });
    }
  }
}
