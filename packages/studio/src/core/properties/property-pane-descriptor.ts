import type { PropertyLayoutNode } from './property-layout-node';
import type { PropertyValuePath } from './property-value-path';

export class PropertyPaneDescriptor {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly nodes: PropertyLayoutNode[],
    readonly when?: string,
    readonly priority?: number,
    readonly headerToggle?: PropertyValuePath
  ) {}
}
