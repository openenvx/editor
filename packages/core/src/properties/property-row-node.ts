import type { PropertyFieldDescriptor } from '../backbone';
import { PropertyLayoutNode } from './property-layout-node';
import type { PropertyLayoutVisitor } from './property-layout-visitor';
import type { PropertyValuePath } from './property-value-path';

export class PropertyRowNode extends PropertyLayoutNode {
  readonly kind = 'row';

  constructor(
    readonly label: string,
    readonly field: PropertyFieldDescriptor,
    readonly path?: PropertyValuePath,
    when?: string
  ) {
    super(when);
  }

  accept<T>(visitor: PropertyLayoutVisitor<T>): T {
    return visitor.visitRow(this);
  }
}
