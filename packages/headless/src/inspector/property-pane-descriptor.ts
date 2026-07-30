import type { InspectorLayoutNode } from './inspector-layout-node';
import type { InspectorValuePath } from './inspector-value-path';

export class PropertyPaneDescriptor {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly nodes: InspectorLayoutNode[],
    readonly when?: string,
    readonly priority?: number,
    readonly headerToggle?: InspectorValuePath
  ) {}
}
