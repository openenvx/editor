import type { InspectorLayoutNode } from './inspector-layout-node';

export class InspectorPaneDescriptor {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly nodes: InspectorLayoutNode[],
    readonly when?: string,
    readonly priority?: number
  ) {}
}
