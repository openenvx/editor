export enum WorkbenchPart {
  ActivityBar = 'activityBar',
  PrimarySidebar = 'primarySidebar',
  EditorArea = 'editorArea',
  SecondarySidebar = 'secondarySidebar',
  StatusBar = 'statusBar',
}

export interface WorkbenchLayout {
  activityBar: boolean;
  primarySidebar: boolean;
  editorArea: boolean;
  secondarySidebar: boolean;
  statusBar: boolean;
  /** Show editor overlay toolbars (top/bottom placements). */
  editorToolbars: boolean;
}

export const DEFAULT_WORKBENCH_LAYOUT: WorkbenchLayout = {
  activityBar: true,
  editorArea: true,
  /** Defaults to false. Canvas Pro / HTML enable via product layouts. */
  editorToolbars: false,
  primarySidebar: true,
  secondarySidebar: true,
  statusBar: true,
};
