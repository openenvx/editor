// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';

import { createKonvaCompatibleCanvas } from '../create-konva-compatible-canvas';
import { ensureKonvaCanvasBackend } from '../ensure-konva-canvas-backend';
import { createRectExportScene } from '../export-test-fixtures';
import { ensureKonvaNodeBackend } from '../node/setup-konva-node';
import { exportCanvasDocument } from './export-canvas-document';

beforeAll(() => {
  ensureKonvaNodeBackend();
  ensureKonvaCanvasBackend(() => createKonvaCompatibleCanvas());
});

describe('browser canvas export entry', () => {
  it('exports a PNG with expected dimensions', async () => {
    const scene = createRectExportScene();
    const result = await exportCanvasDocument(scene, 'page-1', {
      format: 'png',
    });
    expect(result.mimeType).toBe('image/png');
    expect(result.dimensions.widthPx).toBe(300);
    expect(result.dimensions.heightPx).toBe(200);
    expect(result.data.byteLength).toBeGreaterThan(100);
    expect(result.data[0]).toBe(0x89);
    expect(result.data[1]).toBe(0x50);
  });
});
