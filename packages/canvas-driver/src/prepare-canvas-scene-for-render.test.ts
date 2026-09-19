import {
  buildSampleVariableValues,
  formatVariableToken,
  normalizeScene,
} from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import {
  prepareCanvasSceneForRender,
  resolveCanvasExportScene,
} from './prepare-canvas-scene-for-render';

describe('prepareCanvasSceneForRender', () => {
  it('preview mode matches export with buildSampleVariableValues for the same layer', () => {
    const token = formatVariableToken('title');
    const scene = normalizeScene({
      variables: [{ id: 'v1', key: 'title', sample: 'Engineer' }],
      pages: [
        {
          id: 'page-1',
          layout: 'absolute',
          width: 800,
          height: 600,
          layers: [
            {
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
                rotation: 0,
                opacity: 1,
              },
            },
          ],
        },
      ],
    });

    const previewLayer = prepareCanvasSceneForRender(scene, {
      mode: 'preview',
    }).pages[0]!.layers[0]!;
    const exportLayer = resolveCanvasExportScene(scene, {
      variables: buildSampleVariableValues(scene),
    }).pages[0]!.layers[0]!;

    expect(previewLayer.transform!.width).toBe(exportLayer.transform!.width);
    expect(previewLayer.transform!.x).toBe(150);
    expect(previewLayer.transform!.width).toBeLessThan(500);
    expect((previewLayer.data as { html: string }).html).toBe(
      '<p>Engineer</p>'
    );
  });

  it('none mode remeasures text height from stored copy without substituting', () => {
    const token = formatVariableToken('title');
    const scene = normalizeScene({
      pages: [
        {
          id: 'page-1',
          layout: 'absolute',
          width: 800,
          height: 600,
          layers: [
            {
              id: 't1',
              type: 'canvas.text',
              data: {
                html: `<p>${token} with enough words to wrap on a narrow box</p>`,
              },
              transform: {
                x: 0,
                y: 0,
                width: 120,
                height: 20,
                rotation: 0,
                opacity: 1,
              },
            },
          ],
        },
      ],
    });

    const resolved = prepareCanvasSceneForRender(scene, { mode: 'none' });
    const layer = resolved.pages[0]!.layers[0]!;
    expect((layer.data as { html: string }).html).toContain(token);
    expect(layer.transform!.height).toBeGreaterThan(20);
  });
});
