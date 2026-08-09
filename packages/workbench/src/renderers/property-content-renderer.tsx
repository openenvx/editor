import type {
  FieldRendererRegistration,
  PropertyBlockNode,
  PropertyFieldDescriptor,
  PropertyInputGroupCell,
  PropertyInputGroupNode,
  PropertyLayoutNode,
  PropertyLayoutVisitor,
  PropertyRowNode,
  PropertyValuePath,
  PropertyHostContext,
} from '@openenvx/core';
import {
  PropertyPath,
  PropertyPathResolver,
  isPropertyLayoutNodeVisible,
  propertyLayoutNodeReactKey,
} from '@openenvx/core';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { InputGroup } from '../primitives/input-group';
import {
  PropertyFieldBlock,
  PropertyFieldRow,
} from '../primitives/property-field-row';
import { PropertyFieldControl } from './property-field-control';
import { buildCustomRendererMap } from './property-field-registry';
import type { PropertyFieldComponent } from './property-field-types';
import { getFieldId } from './property-field-types';

const defaultEvaluateLayoutWhen = (): boolean => true;

function defaultPropertyFieldRowVariant(
  field: PropertyFieldDescriptor
): 'default' | 'switch' | 'inline' {
  if (field.kind === 'toggle' || field.kind === 'checkbox') {
    return 'switch';
  }
  if (field.kind === 'select' || field.kind === 'segmented') {
    return 'inline';
  }
  return 'default';
}

function resolvePropertyFieldRowVariant(
  field: PropertyFieldDescriptor
): 'default' | 'switch' | 'inline' {
  if (field.layout === 'inline') {
    return 'inline';
  }
  if (field.layout === 'stack') {
    return 'default';
  }
  return defaultPropertyFieldRowVariant(field);
}

export interface PropertyContentRendererProps {
  nodes: PropertyLayoutNode[];
  layerId: string;
  layerData: Record<string, unknown>;
  fieldRenderers: FieldRendererRegistration[];
  hostContext: PropertyHostContext;
  onCommand: (commandId: string) => void;
  /** Evaluates layout-node `when` (context keys + `$` property paths). */
  evaluateLayoutWhen?: (
    clause?: string,
    meta?: { nodeLabel?: string }
  ) => boolean;
}

function defaultRowPath(fieldKey: string): PropertyValuePath {
  return PropertyPath.layerData(fieldKey);
}

function renderNodes(
  nodes: PropertyLayoutNode[],
  context: InspectorRenderContext
): ReactNode[] {
  return nodes
    .map((node, siblingIndex) => {
      if (!isPropertyLayoutNodeVisible(node, context.evaluateLayoutWhen)) {
        return null;
      }
      return (
        <InspectorNodeRenderer
          key={propertyLayoutNodeReactKey(node, context.layerId, siblingIndex)}
          context={context}
          node={node}
        />
      );
    })
    .filter((child) => child !== null && child !== undefined);
}

interface InspectorRenderContext {
  layerId: string;
  layerData: Record<string, unknown>;
  customRenderers: Record<string, PropertyFieldComponent>;
  resolver: PropertyPathResolver;
  onCommand: (commandId: string) => void;
  evaluateLayoutWhen: (
    clause?: string,
    meta?: { nodeLabel?: string }
  ) => boolean;
}

function InspectorNodeRenderer({
  node,
  context,
}: {
  node: PropertyLayoutNode;
  context: InspectorRenderContext;
}): ReactNode {
  return node.accept(createPropertyLayoutVisitor(context));
}

function createPropertyLayoutVisitor(
  context: InspectorRenderContext
): PropertyLayoutVisitor<ReactNode> {
  const { customRenderers } = context;

  return {
    visitBlock(node: PropertyBlockNode): ReactNode {
      const children = renderNodes(node.children, context);
      if (children.length === 0) {
        return null;
      }
      return (
        <PropertyFieldBlock label={node.label}>{children}</PropertyFieldBlock>
      );
    },
    visitInputGroup(node: PropertyInputGroupNode): ReactNode {
      return (
        <PropertyFieldBlock label={node.blockLabel}>
          <InputGroup
            fields={node.cells.map((cell: PropertyInputGroupCell) =>
              toInputGroupField(cell, context)
            )}
          />
        </PropertyFieldBlock>
      );
    },
    visitRow(node: PropertyRowNode): ReactNode {
      const path = node.path ?? defaultRowPath(node.field.key);
      const handle = context.resolver.resolve(path);
      const value = handle.read();

      const control = (
        <PropertyFieldControl
          customRenderers={customRenderers}
          field={node.field}
          layerData={context.layerData}
          layerId={context.layerId}
          onCommand={(command) => context.onCommand(command)}
          onUpdate={(_key, nextValue) => {
            handle.write(nextValue);
          }}
          renderField={(nested) => (
            <PropertyFieldControl
              {...nested}
              customRenderers={customRenderers}
              renderField={(deep) => (
                <PropertyFieldControl
                  {...deep}
                  customRenderers={customRenderers}
                  renderField={() => null}
                />
              )}
            />
          )}
          value={value}
        />
      );

      // Full-width block layout (repeater / slotList): label above, not 56px row.
      if (node.field.layout === 'block') {
        return (
          <PropertyFieldBlock
            description={node.field.description}
            label={node.label}
          >
            {control}
          </PropertyFieldBlock>
        );
      }

      const rowVariant = resolvePropertyFieldRowVariant(node.field);

      return (
        <PropertyFieldRow
          description={node.field.description}
          htmlFor={getFieldId(context.layerId, node.field.key)}
          label={node.label}
          variant={rowVariant}
        >
          {control}
        </PropertyFieldRow>
      );
    },
  };
}

function toInputGroupField(
  cell: PropertyInputGroupCell,
  context: InspectorRenderContext
) {
  const handle = context.resolver.resolve(cell.path);
  return {
    field: cell.field,
    id: `owb-inspector-${cell.path}`,
    label: cell.field.label,
    onChange: (next: number) => {
      handle.write(next);
    },
    value: Number(handle.read() ?? 0),
  };
}

export function PropertyContentRenderer({
  nodes,
  layerId,
  layerData,
  fieldRenderers,
  hostContext,
  onCommand,
  evaluateLayoutWhen,
}: PropertyContentRendererProps) {
  const customRenderers = useMemo(
    () => buildCustomRendererMap(fieldRenderers),
    [fieldRenderers]
  );

  const context = useMemo<InspectorRenderContext>(
    () => ({
      customRenderers,
      evaluateLayoutWhen: evaluateLayoutWhen ?? defaultEvaluateLayoutWhen,
      layerData,
      layerId,
      onCommand,
      resolver: new PropertyPathResolver(hostContext),
    }),
    [
      customRenderers,
      hostContext,
      layerData,
      layerId,
      evaluateLayoutWhen,
      onCommand,
    ]
  );

  return <>{renderNodes(nodes, context)}</>;
}
