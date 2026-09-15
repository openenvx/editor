// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';

import { createRectExportScene } from '../export-test-fixtures';
import { exportCanvasDocument } from './export-canvas-document';
import { ensureKonvaNodeBackend } from './setup-konva-node';

beforeAll(() => {
  ensureKonvaNodeBackend();
});

describe('node canvas export', () => {
  it('exports PNG bytes', async () => {
    const scene = createRectExportScene();
    const result = await exportCanvasDocument(scene, 'page-1', {
      format: 'png',
    });
    expect(result.mimeType).toBe('image/png');
    expect(result.data[0]).toBe(0x89);
    expect(result.data[1]).toBe(0x50);
  });

  it('exports JPG bytes', async () => {
    const scene = createRectExportScene();
    const result = await exportCanvasDocument(scene, 'page-1', {
      format: 'jpg',
    });
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.data[0]).toBe(0xff);
    expect(result.data[1]).toBe(0xd8);
  });

  it('exports PDF bytes', async () => {
    const scene = createRectExportScene();
    const result = await exportCanvasDocument(scene, 'page-1', {
      format: 'pdf',
    });
    expect(result.mimeType).toBe('application/pdf');
    expect(result.data[0]).toBe(0x25);
    expect(result.data[1]).toBe(0x50);
    expect(result.data[2]).toBe(0x44);
    expect(result.data[3]).toBe(0x46);
  });
});
