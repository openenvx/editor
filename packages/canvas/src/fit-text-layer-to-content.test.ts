import { createDefaultTransform, normalizeScene } from '@openenvx/core/schema';
import { describe, expect, it } from 'vitest';

import {
  applyModificationsWithTextFit,
  fitCanvasTextLayerToContent,
  fitSceneCanvasTextToContent,
} from './fit-text-layer-to-content';
import { CanvasTextLayer } from './layers/canvas-text-layer';
import { layoutCurvedText } from './rich-text-arc';
import {
  measurePlainTextWidth,
  measureRichTextContentSize,
  measureRichTextHeight,
} from './rich-text-layout';

const FONT = 'Inter, sans-serif';

function textLayer(options: {
  id?: string;
  html: string;
  width: number;
  height: number;
  fontSize?: number;
  autoFit?: 'none' | 'shrink';
  name?: string;
}) {
  return {
    data: {
      align: 'left' as const,
      autoFit: options.autoFit ?? 'none',
      fill: '#000000',
      fontFamily: FONT,
      fontSize: options.fontSize ?? 24,
      html: options.html,
    },
    id: options.id ?? 't1',
    name: options.name,
    transform: {
      ...createDefaultTransform(),
      height: options.height,
      width: options.width,
    },
    type: 'canvas.text',
  };
}

describe('fitCanvasTextLayerToContent', () => {
  it('grows height to match wrapped content while keeping width', () => {
    const width = 120;
    const layer = textLayer({
      height: 40,
      html: '<p>Hello world this is a long line that will wrap</p>',
      width,
    });

    const fitted = fitCanvasTextLayerToContent(layer);
    const expected = measureRichTextHeight({
      fontFamily: FONT,
      fontSize: 24,
      html: layer.data.html,
      width,
    });

    expect(fitted.transform?.width).toBe(width);
    expect(fitted.transform?.height).toBe(expected);
    expect(fitted.transform!.height).toBeGreaterThan(layer.transform.height);
  });

  it('box mode hugs both width and height to content', () => {
    const layer = textLayer({
      height: 200,
      html: '<p>Hi</p>',
      width: 240,
    });

    const fitted = fitCanvasTextLayerToContent(layer, { mode: 'box' });
    const expected = measureRichTextContentSize({
      fontFamily: FONT,
      fontSize: 24,
      html: '<p>Hi</p>',
    });

    expect(fitted.transform?.width).toBe(expected.width);
    expect(fitted.transform?.height).toBe(expected.height);
    expect(fitted.transform!.width).toBeLessThan(240);
    expect(fitted.transform!.height).toBeLessThan(200);
  });

  it('createDefault text hugs the placeholder copy', () => {
    const created = new CanvasTextLayer().createDefault('t1', {
      height: 600,
      id: 'p1',
      layers: [],
      layout: 'absolute',
      name: 'Page',
      width: 800,
    });

    expect(created.transform!.width).toBeLessThan(240);
    expect(created.transform!.height).toBeLessThan(48);
    expect(created.transform!.width).toBeGreaterThan(8);
    expect(created.transform!.height).toBeGreaterThan(8);
  });

  it('shrinks height when injected copy is shorter than the placeholder box', () => {
    const width = 320;
    const layer = textLayer({
      height: 200,
      html: '<p>Hi</p>',
      width,
    });

    const fitted = fitCanvasTextLayerToContent(layer);
    expect(fitted.transform?.width).toBe(width);
    expect(fitted.transform!.height).toBeLessThan(layer.transform.height);
  });

  it('leaves autoFit shrink layers untouched', () => {
    const layer = textLayer({
      autoFit: 'shrink',
      height: 80,
      html: '<p>Hello world this is a long line that will wrap</p>',
      width: 120,
    });

    expect(fitCanvasTextLayerToContent(layer)).toBe(layer);
  });

  it('curved text hugs measured TextPath bounds', () => {
    const layer = textLayer({
      height: 200,
      html: '<p>Hi</p>',
      width: 240,
    });
    layer.data = { ...layer.data, curve: 60 };
    layer.transform = { ...layer.transform, x: 100 };

    const fitted = fitCanvasTextLayerToContent(layer);
    const centerBefore = layer.transform.x + layer.transform.width / 2;
    const centerAfter =
      fitted.transform!.x + fitted.transform!.width / 2;

    expect(fitted.transform!.height).toBeGreaterThan(24);
    expect(fitted.transform!.width).toBeGreaterThan(8);
    expect(centerAfter).toBeCloseTo(centerBefore, 5);
  });

  it('scrubbing curve keeps the horizontal center fixed', () => {
    let layer = textLayer({
      height: 48,
      html: '<p>$1,195,000</p>',
      width: 300,
    });
    layer = {
      ...layer,
      transform: { ...layer.transform!, x: 50 },
    };
    const center0 = layer.transform!.x + layer.transform!.width / 2;

    for (const curve of [20, 40, 60, 80, 100, 50, 0]) {
      const data = { ...layer.data, curve };
      layer = fitCanvasTextLayerToContent({ ...layer, data });
      const center = layer.transform!.x + layer.transform!.width / 2;
      if (curve === 0) {
        // Straight height-mode keeps prior width; x may not recenter.
        break;
      }
      expect(center).toBeCloseTo(center0, 5);
    }
  });

  it('fit and layoutCurvedText agree on dimensions for the same advance', () => {
    const layer = textLayer({
      height: 48,
      html: '<p>Hello World</p>',
      width: 300,
    });
    layer.data = { ...layer.data, curve: 40 };
    const fitted = fitCanvasTextLayerToContent(layer);
    const plain = 'Hello World';
    const textWidth = measurePlainTextWidth(plain, 24, FONT, 0);
    const layout = layoutCurvedText({
      curve: 40,
      fontFamily: FONT,
      fontSize: 24,
      letterSpacing: 0,
      text: plain,
      textWidth,
    });
    expect(fitted.transform!.width).toBe(layout.width);
    expect(fitted.transform!.height).toBe(layout.height);
  });

  it('applyModificationsWithTextFit remasures named text after injection', () => {
    const scene = normalizeScene({
      pages: [
        {
          height: 600,
          id: 'page-1',
          layers: [
            textLayer({
              height: 48,
              html: '<p>Hi</p>',
              id: 'headline',
              name: 'headline',
              width: 160,
            }),
          ],
          name: 'Page 1',
          width: 800,
        },
      ],
    });

    const resolved = applyModificationsWithTextFit(scene, [
      {
        name: 'headline',
        text: 'A much longer headline that wraps across several lines',
      },
    ]);

    const layer = resolved.pages[0]!.layers[0]!;
    expect(layer.transform?.width).toBe(160);
    expect(layer.transform!.height).toBeGreaterThan(48);
    expect((layer.data as { html: string }).html).toContain('longer headline');
  });

  it('fitSceneCanvasTextToContent walks nested group children', () => {
    const child = textLayer({
      height: 40,
      html: '<p>Hello world this is a long line that will wrap</p>',
      id: 'nested',
      width: 120,
    });
    const scene = normalizeScene({
      pages: [
        {
          height: 600,
          id: 'page-1',
          layers: [
            {
              data: { children: [child] },
              id: 'group-1',
              transform: createDefaultTransform(),
              type: 'canvas.group',
            },
          ],
          name: 'Page 1',
          width: 800,
        },
      ],
    });

    const fitted = fitSceneCanvasTextToContent(scene);
    const nested = (
      fitted.pages[0]!.layers[0]!.data as { children: typeof child[] }
    ).children[0]!;
    expect(nested.transform.height).toBeGreaterThan(40);
  });
});
