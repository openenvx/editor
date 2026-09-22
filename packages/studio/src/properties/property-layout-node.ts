import type { PropertyLayoutVisitor } from './property-layout-visitor';

export abstract class PropertyLayoutNode {
  abstract readonly kind: string;
  readonly when?: string;

  protected constructor(when?: string) {
    this.when = when;
  }

  abstract accept<T>(visitor: PropertyLayoutVisitor<T>): T;
}
