import type {
  FieldRendererRegistration,
  InspectorBlockNode,
  InspectorInputGroupCell,
  InspectorInputGroupNode,
  InspectorLayoutNode,
  InspectorLayoutVisitor,
  InspectorRowNode,
  InspectorValuePath,
  InspectorHostContext,
} from '@openenvx/headless';
import { InspectorPath, InspectorPathResolver } from '@openenvx/headless';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { InputGroup } from '../primitives/input-group';
import {
  InspectorFieldBlock,
  InspectorFieldRow,
} from '../primitives/inspector-field-row';
import { PropertyFieldControl } from './property-field-control';
import { buildCustomRendererMap } from './property-field-registry';
import type { PropertyFieldComponent } from './property-field-types';
import { getFieldId } from './property-field-types';

export interface InspectorContentRendererProps {
  nodes: InspectorLayoutNode[];
  layerId: string;
  layerData: Record<string, unknown>;
  fieldRenderers: FieldRendererRegistration[];
  hostContext: InspectorHostContext;
  onCommand: (commandId: string) => void;
}

function defaultRowPath(fieldKey: string): InspectorValuePath {
  return InspectorPath.layerData(fieldKey);
}

function renderNodes(
  nodes: InspectorLayoutNode[],
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
  resolver: InspectorPathResolver;
  onCommand: (commandId: string) => void;
}

function InspectorNodeRenderer({
  node,
  context,
}: {
  node: InspectorLayoutNode;
  context: InspectorRenderContext;
}) {
  return <>{node.accept(createInspectorLayoutVisitor(context))}</>;
}

function createInspectorLayoutVisitor(
  context: InspectorRenderContext
): InspectorLayoutVisitor<ReactNode> {
  const { customRenderers } = context;

  return {
    visitBlock(node: InspectorBlockNode): ReactNode {
      return (
        <InspectorFieldBlock label={node.label}>
          {renderNodes(node.children, context)}
        </InspectorFieldBlock>
      );
    },
    visitInputGroup(node: InspectorInputGroupNode): ReactNode {
      return (
        <InspectorFieldBlock label={node.blockLabel}>
          <InputGroup
            fields={node.cells.map((cell: InspectorInputGroupCell) =>
              toInputGroupField(cell, context)
            )}
          />
        </InspectorFieldBlock>
      );
    },
    visitRow(node: InspectorRowNode): ReactNode {
      const path = node.path ?? defaultRowPath(node.field.key);
      const handle = context.resolver.resolve(path);
      const value = handle.read();

      return (
        <InspectorFieldRow
          htmlFor={getFieldId(context.layerId, node.field.key)}
          label={node.label}
        >
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
        </InspectorFieldRow>
      );
    },
  };
}

function toInputGroupField(
  cell: InspectorInputGroupCell,
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

export function InspectorContentRenderer({
  nodes,
  layerId,
  layerData,
  fieldRenderers,
  hostContext,
  onCommand,
}: InspectorContentRendererProps) {
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
      resolver: new InspectorPathResolver(hostContext),
    }),
    [customRenderers, hostContext, layerData, layerId, onCommand]
  );

  return <>{renderNodes(nodes, context)}</>;
}
