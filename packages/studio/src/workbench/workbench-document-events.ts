/** Session shape for workbench document events (opaque document payload). */
export interface WorkbenchEditorSession {
  selectedNodeIds: string[];
  primaryNodeId: string | null;
  hoveredLayerId?: string | null;
  activeArtboardId: string;
}

export interface WorkbenchEditorInput {
  uri: string;
  title: string;
  isDirty: boolean;
  scene: unknown;
}

export interface WorkbenchProjectSnapshot {
  document: unknown;
  session: WorkbenchEditorSession;
  contentRevision: number;
}
