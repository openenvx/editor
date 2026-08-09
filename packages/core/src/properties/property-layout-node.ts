import type { PropertyLayoutVisitor } from './property-layout-visitor';

export abstract class PropertyLayoutNode {
  abstract readonly kind: string;

  abstract accept<T>(visitor: PropertyLayoutVisitor<T>): T;
}
