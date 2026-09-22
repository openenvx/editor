import {
  buildSampleVariableValues,
  formatVariableToken,
  nodeTransform,
} from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import {
  prepareCanvasSceneForRender,
  resolveCanvasExportScene,
} from './prepare-canvas-scene-for-render';
import {
  legacyLayer,
  testArtboard,
  testDocument,
} from './test/canvas-document-fixtures';

describe('prepareCanvasSceneForRender', () => {
  it('preview mode matches export with buildSampleVariableValues for the same layer', () => {
    const token = formatVariableToken('title');
    const scene = testDocument(
      [
        testArtboard({
          id: 'page-1',
          nodes: [
            legacyLayer({
              data: {
                align: 'center',
                autoFit: 'hug',
                html: `<p>${token}</p>`,
              },
              id: 't1',
              transform: {
                height: 64,
                opacity: 1,
                rotation: 0,
                width: 500,
                x: 150,
                y: 200,
              },
              type: 'canvas.text',
            }),
          ],
        }),
      ],
      { variables: [{ id: 'v1', key: 'title', sample: 'Engineer' }] }
    );

    const previewLayer = prepareCanvasSceneForRender(scene, {
      mode: 'preview',
    }).artboards[0]!.nodes[0]!;
    const exportLayer = resolveCanvasExportScene(scene, {
      variables: buildSampleVariableValues(scene),
    }).artboards[0]!.nodes[0]!;

    expect(nodeTransform(previewLayer).width).toBe(
      nodeTransform(exportLayer).width
    );
    expect(nodeTransform(previewLayer).x).toBe(150);
    expect(nodeTransform(previewLayer).width).toBeLessThan(500);
    expect((previewLayer.props as { html: string }).html).toBe(
      '<p>Engineer</p>'
    );
  });

  it('none mode remeasures text height from stored copy without substituting', () => {
    const token = formatVariableToken('title');
    const scene = testDocument([
      testArtboard({
        id: 'page-1',
        nodes: [
          legacyLayer({
            data: {
              html: `<p>${token} with enough words to wrap on a narrow box</p>`,
            },
            id: 't1',
            transform: {
              height: 20,
              opacity: 1,
              rotation: 0,
              width: 120,
              x: 0,
              y: 0,
            },
            type: 'canvas.text',
          }),
        ],
      }),
    ]);

    const resolved = prepareCanvasSceneForRender(scene, { mode: 'none' });
    const layer = resolved.artboards[0]!.nodes[0]!;
    expect((layer.props as { html: string }).html).toContain(token);
    expect(nodeTransform(layer).height).toBeGreaterThan(20);
  });
});
