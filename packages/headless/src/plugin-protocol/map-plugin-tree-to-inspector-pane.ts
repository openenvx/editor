import type {
  FieldAction,
  FieldActionClick,
  NumericFieldConfig,
  PropertyFieldDescriptor,
  PropertyFieldOption,
} from '@openenvx/core';
import {
  PLUGIN_FIELD_ELEMENT_TO_KIND,
  type PluginNode,
  type PluginPropValue,
} from '@xmazu/openenvxee-plugin-protocol';

import {
  createInspectorPane,
  InspectorBlockBuilder,
  InspectorPaneBuilder,
} from '../inspector/inspector-pane-builder';
import type { InspectorPaneDescriptor } from '../inspector/inspector-pane-descriptor';
import { InspectorPath } from '../inspector/inspector-path';
import type {
  InspectorInputGroupCell,
  InspectorValuePath,
} from '../inspector/inspector-value-path';
import { encodePluginHandlerCommand } from '../inspector/plugin-inspector-host-context';
import {
  asBoolean,
  asNumber,
  asString,
  pluginNodes,
} from './plugin-tree-helpers';

export interface MapPluginTreeToInspectorPaneOptions {
  /**
   * External panel id — only `plugin.${panelId}.*` binds are allowed;
   * missing binds default to that prefix + field key.
   */
  panelId?: string;
}

type LayoutTarget = InspectorPaneBuilder | InspectorBlockBuilder;

function parseOptions(
  value: PluginPropValue | undefined
): PropertyFieldOption[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const options: PropertyFieldOption[] = [];
  for (const item of value) {
    if (
      typeof item === 'object' &&
      item !== null &&
      !Array.isArray(item) &&
      typeof item.value === 'string' &&
      typeof item.label === 'string'
    ) {
      options.push({
        value: item.value,
        label: item.label,
        ...(typeof item.icon === 'string' ? { icon: item.icon } : {}),
      });
    }
  }
  return options;
}

function parseFieldActionClick(value: unknown): FieldActionClick | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (record.type === 'command' && typeof record.commandId === 'string') {
    return { type: 'command', commandId: record.commandId };
  }
  if (record.type === 'setValue' && typeof record.key === 'string') {
    return { type: 'setValue', key: record.key, value: record.value };
  }
  if (record.type === 'toggle' && typeof record.key === 'string') {
    return { type: 'toggle', key: record.key };
  }
  // Encode plugin handlers as command ids at map time — keep FieldActionClick plugin-free.
  if (record.type === 'handler' && typeof record.handlerId === 'string') {
    return {
      type: 'command',
      commandId: encodePluginHandlerCommand(record.handlerId),
    };
  }
  return null;
}

function parseActions(children: PluginNode[]): FieldAction[] {
  const actions: FieldAction[] = [];
  for (const child of children) {
    if (child.type !== 'Action') {
      continue;
    }
    const onClick = parseFieldActionClick(child.props.onClick);
    if (!onClick) {
      continue;
    }
    actions.push({
      icon: asString(child.props.icon),
      label: asString(child.props.label),
      onClick,
    });
  }
  return actions;
}

function parseNumeric(
  props: PluginNode['props']
): NumericFieldConfig | undefined {
  const scrub = asBoolean(props.scrub, false);
  const min = asNumber(props.min);
  const max = asNumber(props.max);
  const step = asNumber(props.step);
  const precision = asNumber(props.precision);
  const unit = typeof props.unit === 'string' ? props.unit : undefined;
  if (
    !(
      scrub ||
      min !== undefined ||
      max !== undefined ||
      step !== undefined ||
      precision !== undefined ||
      unit !== undefined
    )
  ) {
    return undefined;
  }
  return {
    ...(scrub ? { scrub: true } : {}),
    ...(min === undefined ? {} : { min }),
    ...(max === undefined ? {} : { max }),
    ...(step === undefined ? {} : { step }),
    ...(precision === undefined ? {} : { precision }),
    ...(unit === undefined ? {} : { unit }),
  };
}

function fieldKey(node: PluginNode): string {
  if (typeof node.props.key === 'string' && node.props.key.length > 0) {
    return node.props.key;
  }
  if (typeof node.key === 'string' && node.key.length > 0) {
    return node.key;
  }
  if (typeof node.key === 'number') {
    return String(node.key);
  }
  return asString(node.props.label, 'field');
}

function buildFieldFromNode(node: PluginNode): PropertyFieldDescriptor | null {
  const kind = PLUGIN_FIELD_ELEMENT_TO_KIND[node.type];
  if (!kind) {
    return null;
  }
  const children = pluginNodes(node.children);
  const actions = parseActions(children);
  const popupNode = children.find((child) => child.type === 'Popup');

  const field: PropertyFieldDescriptor = {
    key: fieldKey(node),
    kind,
    label: asString(node.props.label, fieldKey(node)),
  };

  const icon = asString(node.props.icon);
  if (icon) {
    field.icon = icon;
  }
  if (typeof node.props.chrome === 'boolean') {
    field.chrome = node.props.chrome;
  }
  const options = parseOptions(node.props.options);
  if (options) {
    field.options = options;
  }
  const numeric = parseNumeric(node.props);
  if (numeric) {
    field.numeric = numeric;
  }
  if (typeof node.props.uploadCommandId === 'string') {
    field.uploadCommandId = node.props.uploadCommandId;
  }
  if (actions.length > 0) {
    field.actions = actions;
  }
  if (popupNode) {
    const popupFields = pluginNodes(popupNode.children)
      .map((child) => buildFieldFromNode(child))
      .filter((child): child is PropertyFieldDescriptor => child !== null);
    field.popup = {
      icon: asString(popupNode.props.icon, 'settings'),
      fields: popupFields,
      ...(typeof popupNode.props.title === 'string'
        ? { title: popupNode.props.title }
        : {}),
    };
  }

  return field;
}

function resolveBindPath(
  node: PluginNode,
  panelId: string | undefined
): InspectorValuePath | undefined {
  const bind = node.props.bind;
  if (typeof bind === 'string' && bind.length > 0) {
    if (panelId && !bind.startsWith(`plugin.${panelId}.`)) {
      throw new Error(
        `mapPluginTreeToInspectorPane: bind must be under plugin.${panelId}.*, got ${bind}`
      );
    }
    return bind;
  }
  if (panelId) {
    return InspectorPath.plugin(panelId, fieldKey(node));
  }
  return undefined;
}

function mapLayoutChild(
  builder: LayoutTarget,
  node: PluginNode,
  panelId: string | undefined
): void {
  if (node.type === 'Row') {
    const fieldNode = pluginNodes(node.children).find(
      (child) => PLUGIN_FIELD_ELEMENT_TO_KIND[child.type]
    );
    if (!fieldNode) {
      return;
    }
    const field = buildFieldFromNode(fieldNode);
    if (!field) {
      return;
    }
    const label = asString(node.props.label, field.label);
    builder.row(
      label,
      field,
      resolveBindPath(fieldNode, panelId) ?? resolveBindPath(node, panelId)
    );
    return;
  }

  if (node.type === 'InputGroup') {
    const cells: InspectorInputGroupCell[] = [];
    for (const child of pluginNodes(node.children)) {
      const field = buildFieldFromNode(child);
      if (!field) {
        continue;
      }
      const path = resolveBindPath(child, panelId);
      if (!path) {
        continue;
      }
      cells.push({ field, path });
    }
    builder.inputGroup(asString(node.props.label, 'Group'), cells);
    return;
  }

  if (node.type === 'Block' && builder instanceof InspectorPaneBuilder) {
    builder.block(asString(node.props.label, 'Block'), (blockBuilder) => {
      for (const child of pluginNodes(node.children)) {
        mapLayoutChild(blockBuilder, child, panelId);
      }
    });
    return;
  }

  // Bare field under Pane → wrap as a Row using the field label.
  if (PLUGIN_FIELD_ELEMENT_TO_KIND[node.type]) {
    const field = buildFieldFromNode(node);
    if (!field) {
      return;
    }
    builder.row(field.label, field, resolveBindPath(node, panelId));
  }
}

/**
 * Walk a plugin-protocol inspector tree and drive {@link createInspectorPane}.
 * Root must be a `Pane` node. Builders stay the source of truth for defaults.
 */
export function mapPluginTreeToInspectorPane(
  root: PluginNode,
  options?: MapPluginTreeToInspectorPaneOptions
): InspectorPaneDescriptor {
  if (root.type !== 'Pane') {
    throw new Error(
      `mapPluginTreeToInspectorPane: expected Pane root, got ${root.type}`
    );
  }
  const id = asString(root.props.id);
  const title = asString(root.props.title, id || 'Pane');
  if (!id) {
    throw new Error('mapPluginTreeToInspectorPane: Pane requires id');
  }

  const builder: InspectorPaneBuilder = createInspectorPane(id, title);
  if (typeof root.props.when === 'string') {
    builder.when(root.props.when);
  }
  if (typeof root.props.priority === 'number') {
    builder.priority(root.props.priority);
  }

  const panelId = options?.panelId;
  for (const child of pluginNodes(root.children)) {
    mapLayoutChild(builder, child, panelId);
  }

  return builder.build();
}
