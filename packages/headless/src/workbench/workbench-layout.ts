export enum WorkbenchPart {
  PrimarySidebar = 'primarySidebar',
  EditorArea = 'editorArea',
  SecondarySidebar = 'secondarySidebar',
  StatusBar = 'statusBar',
}

export interface WorkbenchLayout {
  primarySidebar: boolean;
  editorArea: boolean;
  secondarySidebar: boolean;
  statusBar: boolean;
  floatingToolbar: boolean;
}

export const DEFAULT_WORKBENCH_LAYOUT: WorkbenchLayout = {
  editorArea: true,
  /** Defaults to false. Canvas Pro and legacy `DEFAULT_CANVAS_LAYOUT` used `true`. */
  floatingToolbar: false,
  primarySidebar: true,
  secondarySidebar: true,
  statusBar: true,
};
