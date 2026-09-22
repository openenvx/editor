// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';

import { formatVariableToken, nodeTransform } from '@openenvx/studio/schema';
import {
  legacyArtboard,
  legacyLayer,
  testDocument,
} from '../../test/canvas-document-fixtures';

import { createRectExportScene } from '../export-test-fixtures';
import { resolveCanvasExportScene } from '../resolve-canvas-export-scene';
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

  it('substitutes variables and hugs text width in node layout', async () => {
    const token = formatVariableToken('title');
    const scene = testDocument([
      legacyArtboard({
        id: 'page-1',
        layout: 'absolute',
        width: 800,
        height: 600,
        layers: [
          legacyLayer({
            id: 't1',
            type: 'canvas.text',
            data: {
              align: 'center',
              autoFit: 'hug',
              html: `<p>${token}</p>`,
            },
            transform: {
              x: 150,
              y: 200,
              width: 500,
              height: 64,
            },
          }),
        ],
      }),
    ]);
    const laidOut = resolveCanvasExportScene(scene, {
      variables: { title: 'Engineer' },
    });
    const layer = laidOut.artboards[0]!.nodes[0]!;
    expect(nodeTransform(layer).width).toBeLessThan(500);
    const result = await exportCanvasDocument(scene, 'page-1', {
      format: 'png',
      variables: { title: 'Engineer' },
    });
    expect(result.mimeType).toBe('image/png');
    expect(result.data.length).toBeGreaterThan(100);
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
