import { resolvePageBackground } from '@openenvx/studio/schema';
import type { Page, Scene } from '@openenvx/studio/schema';

import type {
  CanvasExportFormat,
  CanvasExportOptions,
} from './canvas-document-export-service';

export function findExportPage(scene: Scene, pageId: string): Page {
  const page = scene.pages.find((entry) => entry.id === pageId);
  if (!page) {
    throw new Error(`Page "${pageId}" not found`);
  }
  return page;
}

export function resolveExportBackground(
  page: Page,
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
  if (format === 'pdf') {
    throw new Error(
      `Format "${format}" is not supported in the browser. Import @openenvx/canvas-driver/export/node for PDF export.`
    );
  }
}
