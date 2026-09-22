import { describe, expect, it } from 'vitest';

import { createCanvasLayerRegistry } from '../layers/create-canvas-layer-registry';
import { buildExportSurface } from './build-export-surface';
import { exportCanvasDocument as exportBrowserCanvasDocument } from './browser/export-canvas-document';
import { createRectExportScene } from './export-test-fixtures';

describe('canvas export surface', () => {
  it('builds preview descriptors for export layers', () => {
    const scene = createRectExportScene();
    const surface = buildExportSurface(
      scene,
      'page-1',
      createCanvasLayerRegistry()
    );
    expect(surface).toHaveLength(1);
    expect(surface[0]?.view.kind).toBe('rect');
  });
});

describe('browser canvas export', () => {
  it('rejects PDF in the browser entry', async () => {
    const scene = createRectExportScene();
    await expect(
      exportBrowserCanvasDocument(scene, 'page-1', { format: 'pdf' })
    ).rejects.toThrow(/does not support format "pdf"/);
  });
});
