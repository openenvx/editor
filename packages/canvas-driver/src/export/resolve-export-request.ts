import { resolvePageBackground } from '@openenvx/studio/schema';
import type { Artboard, Document } from '@openenvx/studio/schema';

import type {
  CanvasExportFormat,
  CanvasExportOptions,
} from './canvas-document-export-service';

export function findExportPage(scene: Document, pageId: string): Artboard {
  const page = scene.artboards.find((entry) => entry.id === pageId);
  if (!page) {
    throw new Error(`Artboard "${pageId}" not found`);
  }
  return page;
}

export function resolveExportBackground(
  page: Artboard,
  background?: CanvasExportOptions['background']
): string {
  if (background === 'transparent') {
    return 'rgba(0,0,0,0)';
  }
  if (background === 'white' || background === undefined) {
    return resolvePageBackground(page);
  }
  return background;
}

export function assertBrowserExportFormat(format: CanvasExportFormat): void {
  if (format !== 'png' && format !== 'jpg') {
    throw new Error(`Browser export does not support format "${format}"`);
  }
}
