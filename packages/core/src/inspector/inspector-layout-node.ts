import type { InspectorLayoutVisitor } from './inspector-layout-visitor';

export abstract class InspectorLayoutNode {
  abstract readonly kind: string;

  abstract accept<T>(visitor: InspectorLayoutVisitor<T>): T;
}
