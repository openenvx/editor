import type { InspectorBlockNode } from './inspector-block-node';
import type { InspectorInputGroupNode } from './inspector-input-group-node';
import type { InspectorRowNode } from './inspector-row-node';

export interface InspectorLayoutVisitor<T> {
  visitRow(node: InspectorRowNode): T;
  visitInputGroup(node: InspectorInputGroupNode): T;
  visitBlock(node: InspectorBlockNode): T;
}
