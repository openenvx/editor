import { InspectorLayoutNode } from './inspector-layout-node';
import type { InspectorLayoutVisitor } from './inspector-layout-visitor';

export class InspectorBlockNode extends InspectorLayoutNode {
  readonly kind = 'block';

  constructor(
    readonly label: string,
    readonly children: InspectorLayoutNode[]
  ) {
    super();
  }

  accept<T>(visitor: InspectorLayoutVisitor<T>): T {
    return visitor.visitBlock(this);
  }
}
