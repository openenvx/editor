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
  floatingToolbar: false,
  primarySidebar: true,
  secondarySidebar: true,
  statusBar: true,
};
