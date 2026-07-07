import { createServiceId } from '../runtime/create-service-id';
import type { EditorViewportApi } from './editor-viewport-api';

export interface EditorViewportService {
  getViewport: () => EditorViewportApi | null;
  setViewport: (viewport: EditorViewportApi | null) => void;
  getZoomPercent: () => number;
  setZoomPercent: (percent: number) => void;
}

export const EditorViewportServiceId =
  createServiceId<EditorViewportService>('editorViewport');

export class EditorViewportServiceImpl implements EditorViewportService {
  private viewport: EditorViewportApi | null = null;
  private zoomPercent = 100;

  getViewport(): EditorViewportApi | null {
    return this.viewport;
  }

  setViewport(viewport: EditorViewportApi | null): void {
    this.viewport = viewport;
  }

  getZoomPercent(): number {
    return this.zoomPercent;
  }

  setZoomPercent(percent: number): void {
    this.zoomPercent = percent;
  }
}
