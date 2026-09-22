import {
  applyTemplateVariablesForPreview,
  formatVariableToken,
  nodeTransform,
} from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import type { CanvasLayerSurfaceItem } from '../layer-surface-item';
import { legacyArtboard, legacyLayer, testDocument } from '../test/canvas-document-fixtures';
import { mapLayerSurfaceForVariablePreview } from './map-layer-surface-for-variable-preview';

function textScene(autoFit?: 'hug') {
  const token = formatVariableToken('title');
  const storedWidth = 500;
  const layer = legacyLayer({
    id: 't1',
    type: 'canvas.text',
    data: {
      align: 'center',
      autoFit,
      html: `<p>${token}</p>`,
    },
    transform: {
      x: 150,
      y: 200,
      width: autoFit ? 500 : storedWidth,
      height: 64,
      rotation: 0,
      opacity: 1,
    },
  });
  const scene = testDocument(
    [
      legacyArtboard({
        id: 'page-1',
        layout: 'absolute',
        width: 800,
        height: 600,
        layers: [layer],
      }),
    ],
    {
      variables: [{ id: 'v1', key: 'title', sample: 'Engineer' }],
    }
  );
  return { scene, layer, storedWidth: autoFit ? 500 : storedWidth, token };
}

describe('mapLayerSurfaceForVariablePreview', () => {
  it('keeps box width and substitutes sample html for preview', () => {
    const { scene, layer, storedWidth, token } = textScene();
    const layerSurface: CanvasLayerSurfaceItem[] = [
      {
        layer,
        view: {
          kind: 'richText',
          html: (layer.props as { html: string }).html,
          align: 'center',
        },
      },
    ];

    const mapped = mapLayerSurfaceForVariablePreview(layerSurface, scene);
    expect(nodeTransform(mapped[0]!.layer).width).toBe(storedWidth);
    expect(nodeTransform(mapped[0]!.layer).x).toBe(150);
    expect((mapped[0]!.view as { html: string }).html).toBe('<p>Engineer</p>');

    const previewOnly = applyTemplateVariablesForPreview(scene);
    expect(nodeTransform(previewOnly.artboards[0]!.nodes[0]!).width).toBe(
      storedWidth
    );
    expect((layer.props as { html: string }).html).toContain(token);
  });

  it('hugs preview width for autoFit hug layers', () => {
    const { scene, layer, token } = textScene('hug');
    const layerSurface: CanvasLayerSurfaceItem[] = [
      {
        layer,
        view: {
          kind: 'richText',
          html: (layer.props as { html: string }).html,
          align: 'center',
        },
      },
    ];

    const mapped = mapLayerSurfaceForVariablePreview(layerSurface, scene);
    expect(nodeTransform(mapped[0]!.layer).width).toBeLessThan(500);
    expect((layerSurface[0]!.layer.props as { html: string }).html).toContain(
      token
    );
  });
});
