import type { Scene } from '@openenvx/core/schema';

import type {
  CanvasDocumentExportService,
  CanvasExportFormat,
  CanvasExportOptions,
  CanvasExportResult,
} from '../canvas-document-export-service';
import { exportCanvasDocument } from './export-canvas-document';

export class BrowserCanvasDocumentExportService implements CanvasDocumentExportService {
  exportDocument(
    scene: Scene,
    pageId: string,
    options: CanvasExportOptions
  ): Promise<CanvasExportResult> {
    return exportCanvasDocument(scene, pageId, options);
  }

  supportsFormat(format: CanvasExportFormat): boolean {
    return format === 'png' || format === 'jpg';
  }
}
