import type { EditorViewportApi } from './editor-viewport-api';

export const EditorHostKeys = {
  editorViewport: 'editorViewport',
  editorZoomPercent: 'editorZoomPercent',
} as const;

export type EditorHostViewport = EditorViewportApi | null;
