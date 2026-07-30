import { PropertyLayoutNode } from './property-layout-node';
import type { PropertyLayoutVisitor } from './property-layout-visitor';

export class PropertyBlockNode extends PropertyLayoutNode {
  readonly kind = 'block';

  constructor(
    readonly label: string,
    readonly children: PropertyLayoutNode[]
  ) {
    super();
  }

  accept<T>(visitor: PropertyLayoutVisitor<T>): T {
    return visitor.visitBlock(this);
  }
}
