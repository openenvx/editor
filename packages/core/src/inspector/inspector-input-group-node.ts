import { InspectorLayoutNode } from './inspector-layout-node';
import type { InspectorLayoutVisitor } from './inspector-layout-visitor';
import type { InspectorInputGroupCell } from './inspector-value-path';

export class InspectorInputGroupNode extends InspectorLayoutNode {
  readonly kind = 'inputGroup';

  constructor(
    readonly blockLabel: string,
    readonly cells: InspectorInputGroupCell[]
  ) {
    super();
  }

  accept<T>(visitor: InspectorLayoutVisitor<T>): T {
    return visitor.visitInputGroup(this);
  }
}
