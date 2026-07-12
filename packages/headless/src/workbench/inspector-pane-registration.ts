import type { InspectorLayoutNode } from '../inspector/inspector-layout-node';

export interface InspectorPaneRegistration {
  id: string;
  title: string;
  priority?: number;
  nodes: InspectorLayoutNode[];
}

export interface FieldRendererRegistration {
  kind: string;
  Component: unknown;
}
