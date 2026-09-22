export enum WorkbenchPart {
  ActivityBar = 'activityBar',
  PrimarySidebar = 'primarySidebar',
  EditorArea = 'editorArea',
  SecondarySidebar = 'secondarySidebar',
  Panel = 'panel',
  StatusBar = 'statusBar',
  TopBar = 'topBar',
}

export interface WorkbenchLayout {
  activityBar: boolean;
  primarySidebar: boolean;
  editorArea: boolean;
  secondarySidebar: boolean;
  panel: boolean;
  statusBar: boolean;
  /** Show editor overlay toolbars (top/bottom placements). */
  editorToolbars: boolean;
  /** Shell header above the editor body. Off by default; product plugins contribute actions via `TopBarContribution`. */
  topBar: boolean;
}

export const DEFAULT_WORKBENCH_LAYOUT: WorkbenchLayout = {
  activityBar: true,
  editorArea: true,
  /** Defaults to false. Canvas Pro / HTML enable via product layouts. */
  editorToolbars: false,
  primarySidebar: true,
  secondarySidebar: true,
  panel: false,
  statusBar: true,
  /** Defaults to false. Email enables via `DEFAULT_EMAIL_LAYOUT`. */
  topBar: false,
};
