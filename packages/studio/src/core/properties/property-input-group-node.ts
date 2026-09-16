import { PropertyLayoutNode } from './property-layout-node';
import type { PropertyLayoutVisitor } from './property-layout-visitor';
import type { PropertyInputGroupCell } from './property-value-path';

export class PropertyInputGroupNode extends PropertyLayoutNode {
  readonly kind = 'inputGroup';

  constructor(
    readonly blockLabel: string,
    readonly cells: PropertyInputGroupCell[],
    when?: string
  ) {
    super(when);
  }

  accept<T>(visitor: PropertyLayoutVisitor<T>): T {
    return visitor.visitInputGroup(this);
  }
}
