import type { PropertyBlockNode } from './property-block-node';
import type { PropertyInputGroupNode } from './property-input-group-node';
import type { PropertyRowNode } from './property-row-node';

export interface PropertyLayoutVisitor<T> {
  visitRow(node: PropertyRowNode): T;
  visitInputGroup(node: PropertyInputGroupNode): T;
  visitBlock(node: PropertyBlockNode): T;
}
