import { createDefaultTransform, nodeTransform } from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import { legacyArtboard, legacyLayer } from '../test/canvas-document-fixtures';
import {
  findPresetForPage,
  getDefaultPageDimensions,
  resolvePagePreset,
} from '../page-presets';
import { resizeAbsolutePage } from './scale-page-content';

describe('resizeAbsolutePage', () => {
  it('scales layers uniformly when moving from A4 portrait to A5 portrait', () => {
    const a4 = resolvePagePreset('a4-portrait')!;
    const a5 = resolvePagePreset('a5-portrait')!;
    const scaleX = a5.width / a4.width;
    const scaleY = a5.height / a4.height;

    const page = legacyArtboard({
      id: 'page-1',
      layout: 'absolute',
      width: a4.width,
      height: a4.height,
      layers: [
        legacyLayer({
          id: 'rect-1',
          type: 'canvas.rect',
          data: {
            fill: '#000000',
            cornerRadius: {
              topLeft: 8,
              topRight: 8,
              bottomRight: 8,
              bottomLeft: 8,
            },
            strokeWidth: 2,
          },
          transform: {
            ...createDefaultTransform(),
            x: 100,
            y: 200,
            width: 400,
            height: 120,
          },
        }),
      ],
    });

    const resized = resizeAbsolutePage(page, a5.width, a5.height);
    const layer = resized.nodes[0]!;
    const transform = nodeTransform(layer);

    expect(transform.x).toBeCloseTo(100 * scaleX, 5);
    expect(transform.y).toBeCloseTo(200 * scaleY, 5);
    expect(transform.width).toBeCloseTo(400 * scaleX, 5);
    expect(transform.height).toBeCloseTo(120 * scaleY, 5);
    expect(
      (layer.props as { cornerRadius: { topLeft: number } }).cornerRadius
        .topLeft
    ).toBeCloseTo(8 * ((scaleX + scaleY) / 2), 5);
    expect(resized.space.width).toBe(a5.width);
    expect(resized.space.height).toBe(a5.height);
  });

  it('scales layers per-axis when flipping A4 portrait to A4 landscape', () => {
    const portrait = resolvePagePreset('a4-portrait')!;
    const landscape = resolvePagePreset('a4-landscape')!;
    const scaleX = landscape.width / portrait.width;
    const scaleY = landscape.height / portrait.height;

    const page = legacyArtboard({
      id: 'page-1',
      layout: 'absolute',
      width: portrait.width,
      height: portrait.height,
      layers: [
        legacyLayer({
          id: 'image-1',
          type: 'canvas.image',
          data: { alt: 'Image', assetRef: 'https://example.com/image.png' },
          transform: {
            ...createDefaultTransform(),
            x: 40,
            y: 80,
            width: 320,
            height: 240,
          },
        }),
      ],
    });

    const resized = resizeAbsolutePage(page, landscape.width, landscape.height);
    const transform = nodeTransform(resized.nodes[0]!);

    expect(transform.x).toBeCloseTo(40 * scaleX, 5);
    expect(transform.y).toBeCloseTo(80 * scaleY, 5);
    expect(transform.width).toBeCloseTo(320 * scaleX, 5);
    expect(transform.height).toBeCloseTo(240 * scaleY, 5);
    expect(scaleX).not.toBeCloseTo(scaleY, 5);
  });

  it('remeasures rich text height after scaling font and width', () => {
    const portrait = resolvePagePreset('a4-portrait')!;
    const a5 = resolvePagePreset('a5-portrait')!;

    const page = legacyArtboard({
      id: 'page-1',
      layout: 'absolute',
      width: portrait.width,
      height: portrait.height,
      layers: [
        legacyLayer({
          id: 'text-1',
          type: 'canvas.text',
          data: {
            html: '<p>Line one</p><p>Line two with more words</p>',
            fontSize: 48,
            fontFamily: 'Inter, sans-serif',
            align: 'left' as const,
          },
          transform: {
            ...createDefaultTransform(),
            x: 40,
            y: 100,
            width: portrait.width - 80,
            height: 200,
          },
        }),
      ],
    });

    const resized = resizeAbsolutePage(page, a5.width, a5.height);
    const layer = resized.nodes[0]!;
    const transform = nodeTransform(layer);
    const scaleX = a5.width / portrait.width;
    const scaleY = a5.height / portrait.height;

    expect((layer.props as { fontSize: number }).fontSize).toBeCloseTo(
      48 * ((scaleX + scaleY) / 2),
      5
    );
    expect(transform.width).toBeCloseTo((portrait.width - 80) * scaleX, 5);
    expect(transform.height).toBeGreaterThan(0);
    expect(transform.height).not.toBeCloseTo(200 * scaleY, 0);
  });

  it('scales nested container children and gap', () => {
    const defaults = getDefaultPageDimensions();
    const child = legacyLayer({
      id: 'child-1',
      type: 'canvas.rect',
      data: { fill: '#000000' },
      transform: {
        ...createDefaultTransform(),
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      },
    });
    const page = legacyArtboard({
      id: 'page-1',
      layout: 'absolute',
      width: defaults.width,
      height: defaults.height,
      layers: [
        legacyLayer({
          id: 'container-1',
          type: 'container',
          data: {
            layout: 'column' as const,
            gap: 16,
          },
          children: [child],
          transform: {
            ...createDefaultTransform(),
            x: 0,
            y: 0,
            width: 200,
            height: 200,
          },
        }),
      ],
    });

    const resized = resizeAbsolutePage(page, defaults.width / 2, defaults.height / 2);
    const container = resized.nodes[0]!;
    const scaledChild = container.children![0]!;
    const childTransform = nodeTransform(scaledChild);

    expect((container.props as { gap: number }).gap).toBe(8);
    expect(childTransform.x).toBe(5);
    expect(childTransform.y).toBe(10);
    expect(childTransform.width).toBe(50);
    expect(childTransform.height).toBe(25);
  });

  it('returns the page unchanged when dimensions match', () => {
    const a4 = resolvePagePreset('a4-portrait')!;
    const page = legacyArtboard({
      id: 'page-1',
      layout: 'absolute',
      width: a4.width,
      height: a4.height,
      layers: [],
    });

    expect(resizeAbsolutePage(page, a4.width, a4.height)).toBe(page);
  });

  it('matches resized page to a preset via findPresetForPage', () => {
    const a4 = resolvePagePreset('a4-portrait')!;
    const a5 = resolvePagePreset('a5-portrait')!;
    const page = legacyArtboard({
      id: 'page-1',
      layout: 'absolute',
      width: a4.width,
      height: a4.height,
      layers: [],
    });

    const resized = resizeAbsolutePage(page, a5.width, a5.height);
    expect(findPresetForPage(resized)?.id).toBe('a5-portrait');
  });
});
