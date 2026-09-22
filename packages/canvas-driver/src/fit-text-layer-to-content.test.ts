import {
  applyNodeTransform,
  createDefaultTransform,
  nodeTransform,
} from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import {
  applyModificationsWithTextFit,
  fitCanvasTextLayerToContent,
  fitSceneCanvasTextToContent,
} from './fit-text-layer-to-content';
import { CanvasTextLayer } from './layers/canvas-text-layer';
import { layoutCurvedText } from './rich-text-arc';
import { measureRichTextContentSize } from './rich-text-content-measure';
import {
  measurePlainTextWidth,
  measureRichTextHeight,
} from './rich-text-layout';
import {
  legacyArtboard,
  legacyLayer,
  testArtboard,
  testDocument,
} from './test/canvas-document-fixtures';

const FONT = 'Inter, sans-serif';

function textLayer(options: {
  id?: string;
  html: string;
  width: number;
  height: number;
  fontSize?: number;
  autoFit?: 'none' | 'shrink' | 'hug';
  name?: string;
}) {
  return legacyLayer({
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
  });
}

function textProps(layer: ReturnType<typeof textLayer>) {
  return layer.props as {
    align?: string;
    autoFit?: string;
    html: string;
    curve?: number;
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
    const fittedT = nodeTransform(fitted);
    const expected = measureRichTextHeight({
      fontFamily: FONT,
      fontSize: 24,
      html: textProps(layer).html,
      width,
    });

    expect(fittedT.width).toBe(width);
    expect(fittedT.height).toBe(expected);
    expect(expected).toBeGreaterThan(0);
  });

  it('box mode hugs both width and height to content', () => {
    const layer = textLayer({
      height: 200,
      html: '<p>Hi</p>',
      width: 240,
    });

    const fitted = fitCanvasTextLayerToContent(layer, { mode: 'box' });
    const fittedT = nodeTransform(fitted);
    const expected = measureRichTextContentSize({
      fontFamily: FONT,
      fontSize: 24,
      html: '<p>Hi</p>',
    });

    expect(fittedT.width).toBe(expected.width);
    expect(fittedT.height).toBe(expected.height);
    expect(fittedT.width).toBeLessThan(240);
    expect(fittedT.height).toBeLessThan(200);
  });

  it('box mode hugs both width and height to content and keeps x', () => {
    let layer = textLayer({
      height: 200,
      html: '<p>Hi</p>',
      width: 240,
    });
    layer = {
      ...layer,
      props: { ...textProps(layer), align: 'center' },
    };
    layer = applyNodeTransform(layer, {
      ...nodeTransform(layer),
      x: 100,
    });

    const fitted = fitCanvasTextLayerToContent(layer, { mode: 'box' });
    const fittedT = nodeTransform(fitted);
    const expected = measureRichTextContentSize({
      fontFamily: FONT,
      fontSize: 24,
      html: '<p>Hi</p>',
    });

    expect(fittedT.width).toBe(expected.width);
    expect(fittedT.height).toBe(expected.height);
    expect(fittedT.x).toBe(100);
  });

  it('hug autoFit hugs content without moving x', () => {
    let layer = textLayer({
      autoFit: 'hug',
      height: 200,
      html: '<p>Hi</p>',
      width: 240,
    });
    layer = {
      ...layer,
      props: { ...textProps(layer), align: 'center' },
    };
    layer = applyNodeTransform(layer, { ...nodeTransform(layer), x: 50 });

    const fitted = fitCanvasTextLayerToContent(layer);
    const fittedT = nodeTransform(fitted);

    expect(fittedT.width).toBeLessThan(240);
    expect(fittedT.x).toBe(50);
  });

  it('createDefault text hugs the placeholder copy', () => {
    const created = new CanvasTextLayer().createDefault(
      't1',
      testArtboard({ id: 'p1' })
    );
    const t = nodeTransform(created);

    expect(t.width).toBeLessThan(240);
    expect(t.height).toBeLessThan(48);
    expect(t.width).toBeGreaterThan(8);
    expect(t.height).toBeGreaterThan(8);
  });

  it('shrinks height when injected copy is shorter than the placeholder box', () => {
    const width = 320;
    const layer = textLayer({
      height: 200,
      html: '<p>Hi</p>',
      width,
    });

    const fitted = fitCanvasTextLayerToContent(layer);
    const fittedT = nodeTransform(fitted);
    expect(fittedT.width).toBe(width);
    expect(fittedT.height).toBeLessThan(nodeTransform(layer).height);
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
    let layer = textLayer({
      height: 200,
      html: '<p>Hi</p>',
      width: 240,
    });
    layer = {
      ...layer,
      props: { ...textProps(layer), curve: 60 },
    };
    layer = applyNodeTransform(layer, { ...nodeTransform(layer), x: 100 });

    const fitted = fitCanvasTextLayerToContent(layer);
    const before = nodeTransform(layer);
    const after = nodeTransform(fitted);
    const centerBefore = before.x + before.width / 2;
    const centerAfter = after.x + after.width / 2;

    expect(after.height).toBeGreaterThan(24);
    expect(after.width).toBeGreaterThan(8);
    expect(centerAfter).toBeCloseTo(centerBefore, 5);
  });

  it('scrubbing curve keeps the horizontal center fixed', () => {
    let layer = textLayer({
      height: 48,
      html: '<p>$1,195,000</p>',
      width: 300,
    });
    layer = applyNodeTransform(layer, {
      ...nodeTransform(layer),
      x: 50,
    });
    const center0 =
      nodeTransform(layer).x + nodeTransform(layer).width / 2;

    for (const curve of [20, 40, 60, 80, 100, 50, 0]) {
      layer = fitCanvasTextLayerToContent({
        ...layer,
        props: { ...textProps(layer), curve },
      });
      const center =
        nodeTransform(layer).x + nodeTransform(layer).width / 2;
      if (curve === 0) {
        break;
      }
      expect(center).toBeCloseTo(center0, 5);
    }
  });

  it('fit and layoutCurvedText agree on dimensions for the same advance', () => {
    let layer = textLayer({
      height: 48,
      html: '<p>Hello World</p>',
      width: 300,
    });
    layer = {
      ...layer,
      props: { ...textProps(layer), curve: 40 },
    };
    const fitted = fitCanvasTextLayerToContent(layer);
    const fittedT = nodeTransform(fitted);
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
    expect(fittedT.width).toBe(layout.width);
    expect(fittedT.height).toBe(layout.height);
  });

  it('applyModificationsWithTextFit remasures named text after injection', () => {
    const scene = testDocument([
      legacyArtboard({
        id: 'page-1',
        height: 600,
        name: 'Page 1',
        width: 800,
        layers: [
          textLayer({
            height: 48,
            html: '<p>Hi</p>',
            id: 'headline',
            name: 'headline',
            width: 160,
          }),
        ],
      }),
    ]);

    const resolved = applyModificationsWithTextFit(scene, [
      {
        name: 'headline',
        text: 'A much longer headline that wraps across several lines',
      },
    ]);

    const layer = resolved.artboards[0]!.nodes[0]!;
    const html = (layer.props as { html: string }).html;
    const t = nodeTransform(layer);
    expect(t.width).toBe(160);
    expect(t.height).toBe(
      measureRichTextHeight({
        fontFamily: FONT,
        fontSize: 24,
        html,
        width: 160,
      })
    );
    expect(html).toContain('longer headline');
  });

  it('fitSceneCanvasTextToContent walks nested group children', () => {
    const child = textLayer({
      height: 40,
      html: '<p>Hello world this is a long line that will wrap</p>',
      id: 'nested',
      width: 120,
    });
    const scene = testDocument([
      legacyArtboard({
        id: 'page-1',
        height: 600,
        name: 'Page 1',
        width: 800,
        layers: [
          legacyLayer({
            children: [child],
            id: 'group-1',
            transform: createDefaultTransform(),
            type: 'canvas.group',
          }),
        ],
      }),
    ]);

    const fitted = fitSceneCanvasTextToContent(scene);
    const nested = fitted.artboards[0]!.nodes[0]!.children![0]!;
    expect(nodeTransform(nested).height).toBe(
      measureRichTextHeight({
        fontFamily: FONT,
        fontSize: 24,
        html: (nested.props as { html: string }).html,
        width: 120,
      })
    );
  });
});
