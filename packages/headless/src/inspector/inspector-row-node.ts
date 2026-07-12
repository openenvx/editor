import type { PropertyFieldDescriptor } from '@openenvx/core';

import { InspectorLayoutNode } from './inspector-layout-node';
import type { InspectorLayoutVisitor } from './inspector-layout-visitor';
import type { InspectorValuePath } from './inspector-value-path';

export class InspectorRowNode extends InspectorLayoutNode {
  readonly kind = 'row';

  constructor(
    readonly label: string,
    readonly field: PropertyFieldDescriptor,
    readonly path?: InspectorValuePath
  ) {
    super();
  }

  accept<T>(visitor: InspectorLayoutVisitor<T>): T {
    return visitor.visitRow(this);
  }
}
