import type { PluginNode } from '@xmazu/openenvxee-plugin-protocol';

import {
  createStatusBarBuilder,
  type StatusBarBuilder,
  type StatusBarItemDescriptor,
} from '../builders/status-bar-builder';
import {
  asString,
  isAllowedCommand,
  parseDropdownItems,
  pluginNodes,
  shellOptions,
} from './plugin-tree-helpers';

function regionOf(
  builder: StatusBarBuilder,
  alignment: string
): ReturnType<StatusBarBuilder['left']> {
  return alignment === 'right' ? builder.right() : builder.left();
}

/**
 * Drive {@link createStatusBarBuilder} from a plugin-protocol `StatusBar` tree.
 */
export function mapPluginTreeToStatusBar(
  root: PluginNode,
  allowedCommands?: ReadonlySet<string>
): StatusBarItemDescriptor[] {
  const builder = createStatusBarBuilder();
  contributePluginTreeToStatusBar(root, builder, allowedCommands);
  return builder.build();
}

export function contributePluginTreeToStatusBar(
  root: PluginNode,
  builder: StatusBarBuilder,
  allowedCommands?: ReadonlySet<string>
): void {
  if (root.type !== 'StatusBar') {
    throw new Error(
      `contributePluginTreeToStatusBar: expected StatusBar root, got ${root.type}`
    );
  }

  for (const child of pluginNodes(root.children)) {
    const alignment = asString(child.props.alignment, 'left');
    const region = regionOf(builder, alignment);
    const options = shellOptions(child.props);

    if (child.type === 'StatusBarText') {
      const commandId =
        typeof child.props.commandId === 'string'
          ? child.props.commandId
          : undefined;
      if (commandId && !isAllowedCommand(commandId, allowedCommands)) {
        continue;
      }
      region.text(asString(child.props.text), {
        id: asString(child.props.id),
        ...options,
        ...(commandId ? { commandId } : {}),
      });
      continue;
    }

    if (child.type === 'StatusBarDropdown') {
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
      });
    }
  }
}
