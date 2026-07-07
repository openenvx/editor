import type { EditorViewportApi } from './editor-viewport-api';

/** Props passed from workbench shell to registered editor pane components. */
export interface EditorPaneHostProps {
  layerSurface: readonly unknown[];
  onZoomChange?: (zoomPercent: number) => void;
  onContainerResize?: (size: { width: number; height: number }) => void;
  onViewportApiReady?: (api: EditorViewportApi | null) => void;
}

export interface EditorPaneRegistration {
  editorPaneKind: string;
  Component: unknown;
}
