import type {
  FieldRendererRegistration,
  PropertyBlockNode,
  PropertyInputGroupCell,
  PropertyInputGroupNode,
  PropertyLayoutNode,
  PropertyLayoutVisitor,
  PropertyRowNode,
  PropertyValuePath,
  PropertyHostContext,
} from '@openenvx/headless';
import { PropertyPath, PropertyPathResolver } from '@openenvx/headless';
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

export interface PropertyContentRendererProps {
  nodes: PropertyLayoutNode[];
  layerId: string;
  layerData: Record<string, unknown>;
  fieldRenderers: FieldRendererRegistration[];
  hostContext: PropertyHostContext;
  onCommand: (commandId: string) => void;
}

function defaultRowPath(fieldKey: string): PropertyValuePath {
  return PropertyPath.layerData(fieldKey);
}

function renderNodes(
  nodes: PropertyLayoutNode[],
  context: InspectorRenderContext
): ReactNode {
  return nodes.map((node, index) => (
    <InspectorNodeRenderer
      key={`${node.kind}-${index}`}
      context={context}
      node={node}
    />
  ));
}

interface InspectorRenderContext {
  layerId: string;
  layerData: Record<string, unknown>;
  customRenderers: Record<string, PropertyFieldComponent>;
  resolver: PropertyPathResolver;
  onCommand: (commandId: string) => void;
}

function InspectorNodeRenderer({
  node,
  context,
}: {
  node: PropertyLayoutNode;
  context: InspectorRenderContext;
}) {
  return <>{node.accept(createPropertyLayoutVisitor(context))}</>;
}

function createPropertyLayoutVisitor(
  context: InspectorRenderContext
): PropertyLayoutVisitor<ReactNode> {
  const { customRenderers } = context;

  return {
    visitBlock(node: PropertyBlockNode): ReactNode {
      return (
        <PropertyFieldBlock label={node.label}>
          {renderNodes(node.children, context)}
        </PropertyFieldBlock>
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

      // Full-width chrome (repeater / slotList): block label above, not 56px row.
      if (node.field.chrome === false) {
        return (
          <PropertyFieldBlock label={node.label}>{control}</PropertyFieldBlock>
        );
      }

      return (
        <PropertyFieldRow
          htmlFor={getFieldId(context.layerId, node.field.key)}
          label={node.label}
          variant={node.field.kind === 'toggle' ? 'switch' : 'default'}
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
}: PropertyContentRendererProps) {
  const customRenderers = useMemo(
    () => buildCustomRendererMap(fieldRenderers),
    [fieldRenderers]
  );

  const context = useMemo<InspectorRenderContext>(
    () => ({
      customRenderers,
      layerData,
      layerId,
      onCommand,
      resolver: new PropertyPathResolver(hostContext),
    }),
    [customRenderers, hostContext, layerData, layerId, onCommand]
  );

  return <>{renderNodes(nodes, context)}</>;
}
