import type { PluginNode } from '@xmazu/openenvxee-protocol';

import {
  createToolbarBuilder,
  TOOLBAR_PLACEMENTS,
  type ToolbarBuilder,
  type ToolbarItemDescriptor,
  type ToolbarPlacement,
} from '../builders/toolbar-builder';
import {
  asNumber,
  asString,
  isAllowedCommand,
  parseDropdownItems,
  pluginNodes,
  shellOptions,
} from './plugin-tree-helpers';

function parsePlacement(value: unknown): ToolbarPlacement {
  if (
    typeof value === 'string' &&
    (TOOLBAR_PLACEMENTS as readonly string[]).includes(value)
  ) {
    return value as ToolbarPlacement;
  }
  return 'bottom-center';
}

/**
 * Drive {@link createToolbarBuilder} from a plugin-protocol `Toolbar` tree.
 * Root may set `placement` (defaults to `bottom-center`).
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

  const region = builder.placement(parsePlacement(root.props.placement));

  for (const child of pluginNodes(root.children)) {
    const options = shellOptions(child.props);
    const group = asNumber(child.props.group);

    if (child.type === 'ToolbarCommand') {
      const commandId = asString(child.props.commandId);
      if (!isAllowedCommand(commandId, allowedCommands)) {
        continue;
      }
      region.command(asString(child.props.id), {
        commandId,
        icon: asString(child.props.icon),
        labelKey: asString(child.props.labelKey),
        ...options,
        ...(group === undefined ? {} : { group }),
        ...(typeof child.props.toggledWhen === 'string'
          ? { toggledWhen: child.props.toggledWhen }
          : {}),
        ...(child.props.args !== undefined ? { args: child.props.args } : {}),
      });
      continue;
    }

    if (child.type === 'Separator') {
      region.separator(asString(child.props.id, 'separator'), {
        ...options,
        ...(group === undefined ? {} : { group }),
      });
      continue;
    }

    if (child.type === 'ToolbarDropdown') {
      region.dropdown(asString(child.props.id), {
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
